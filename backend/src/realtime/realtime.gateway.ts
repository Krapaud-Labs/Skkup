import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'http';
import type { Server, Socket } from 'socket.io';
import { lireCookieSession } from '../auth/cookie-session';
import { origineDeclaree, originesAutorisees } from '../common/cors';
import { sautsDeProxyDeConfiance } from '../common/proxy-de-confiance';
import { ROOM_TIRAGES, roomUtilisateur } from './realtime.constants';
import { PrismaService } from '../prisma/prisma.service';
import { SessionRevocationService } from '../auth/session-revocation.service';

// ─── Gateway WebSocket (Socket.io) ───────────────────────────────────────────
/**
 * Canal de notification uniquement : tout ce qui est poussé ici a déjà
 * été persisté en base (PostgreSQL reste la source de vérité). Aucune
 * donnée sensible (mot de passe ou secret d'authentification) n'y transite.
 */

/**
 * Plafond de connexions simultanées par utilisateur. Un onglet par
 * appareil plus quelques reconnexions en vol suffisent largement :
 * au-delà, c'est une tentative de saturation (docs/05-security.md,
 * menace 4) et on refuse.
 */
const MAX_CONNEXIONS_PAR_UTILISATEUR = 10;
const MAX_TENTATIVES_PAR_IP_PAR_MINUTE = 30;
const FENETRE_TENTATIVES_MS = 60_000;

interface PayloadJwt {
  sub?: unknown;
  email?: unknown;
  sessionVersion?: unknown;
}

// Données attachées à la socket côté serveur uniquement : le client n'y
// a jamais accès en écriture.
interface DonneesSocket {
  userId?: string;
}

interface CompteurTentatives {
  debutFenetre: number;
  nombre: number;
}

/**
 * Taille maximale d'une trame reçue du client. Le canal est
 * unidirectionnel : aucun `@SubscribeMessage` n'est déclaré, le client
 * n'a donc rien de légitime à envoyer au-delà des trames de contrôle
 * d'Engine.io. Le défaut de Socket.io (1 Mo) laisserait un client
 * authentifié pousser des trames d'1 Mo en boucle que le serveur
 * désérialise pour rien : on ramène le plafond au strict nécessaire.
 */
const TAILLE_MAX_TRAME_CLIENT = 8 * 1024;

/**
 * Délai maximal entre l'ouverture du transport et la fin de la poignée
 * de main. Le défaut de Socket.io (45 s) laisse trop longtemps ouvertes
 * des connexions qui n'aboutiront jamais.
 */
const DELAI_MAX_POIGNEE_DE_MAIN_MS = 10_000;

/**
 * Vérification d'origine de la poignée de main, équivalent WebSocket du
 * garde HTTP `VerificationOrigineGuard`.
 *
 * L'option `cors` de Socket.io ne suffit pas : le middleware CORS pose
 * (ou omet) des en-têtes, il ne refuse jamais la connexion. Or le
 * navigateur n'applique pas la politique d'origine au transport
 * WebSocket : une page tierce ouvre la socket, l'en-tête `Origin` non
 * déclaré n'empêche rien et seule la lecture d'une réponse *polling*
 * aurait été bloquée. Depuis que la session est portée par un cookie,
 * un sous-domaine same-site (page marketing compromise, préproduction,
 * CNAME abandonné) verrait donc ce cookie joint automatiquement à sa
 * poignée de main et hériterait de la room privée de la victime.
 *
 * Même déclencheur que le garde HTTP : le contrôle ne s'applique que si
 * la poignée de main porte le cookie de session. Un client porteur
 * (extension navigateur, qui s'authentifie par `auth.token` ou
 * `Authorization`) n'a pas d'authentification ambiante à protéger et
 * passe sans friction, quelle que soit son origine.
 */
export function poigneeDeMainAutorisee(requete: IncomingMessage): boolean {
  if (!lireCookieSession(requete.headers?.cookie)) {
    return true;
  }
  return origineDeclaree(requete.headers?.origin);
}

@WebSocketGateway({
  cors: { origin: originesAutorisees(), credentials: true },
  // Refus effectif, contrairement à `cors` qui ne fait que poser des
  // en-têtes. Évalué à chaque poignée de main, pas au chargement du
  // module.
  allowRequest: (
    requete: IncomingMessage,
    repondre: (message: string | null | undefined, autorise: boolean) => void,
  ) => {
    repondre(null, poigneeDeMainAutorisee(requete));
  },
  maxHttpBufferSize: TAILLE_MAX_TRAME_CLIENT,
  connectTimeout: DELAI_MAX_POIGNEE_DE_MAIN_MS,
  // Le protocole Engine.io v3 est refusé : il n'apporte rien ici et
  // élargit inutilement la surface de parsing.
  allowEIO3: false,
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  // Sockets ouvertes par utilisateur, pour plafonner les connexions
  // simultanées. En mémoire du processus : suffisant tant que l'API
  // tourne en instance unique (voir docs/08-docker-infra.md).
  private readonly connexionsParUtilisateur = new Map<string, Set<Socket>>();
  private readonly tentativesParIp = new Map<string, CompteurTentatives>();
  private nombreTentatives = 0;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    sessionRevocation: SessionRevocationService,
  ) {
    sessionRevocation.abonner((userId) => this.revoquerConnexions(userId));
  }

  // ─── Poignée de main ───────────────────────────────────────────────────────
  async handleConnection(client: Socket): Promise<void> {
    if (!this.accepterTentative(adresseClienteSocket(client))) {
      this.refuser(client, 'trop de tentatives depuis cette adresse');
      return;
    }

    const token = extraireToken(client);
    if (!token) {
      this.refuser(client, 'token absent');
      return;
    }

    let userId: string;
    try {
      // Algorithme épinglé sur celui utilisé à la signature : un token
      // proposant un autre algorithme est rejeté d'office.
      const payload = await this.jwtService.verifyAsync<PayloadJwt>(token, {
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
      });
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        this.refuser(client, 'payload invalide');
        return;
      }
      userId = payload.sub;
      const utilisateur = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { sessionVersion: true },
      });
      const version =
        typeof payload.sessionVersion === 'number' ? payload.sessionVersion : 0;
      if (!utilisateur || utilisateur.sessionVersion !== version) {
        this.refuser(client, 'session révoquée');
        return;
      }
    } catch {
      // Signature invalide, token expiré, format inattendu : dans le
      // doute on refuse, jamais de canal anonyme.
      this.refuser(client, 'token invalide');
      return;
    }

    const ouvertes =
      this.connexionsParUtilisateur.get(userId) ?? new Set<Socket>();
    if (ouvertes.size >= MAX_CONNEXIONS_PAR_UTILISATEUR) {
      this.refuser(client, 'trop de connexions simultanées');
      return;
    }
    ouvertes.add(client);
    this.connexionsParUtilisateur.set(userId, ouvertes);

    // La room est dérivée du `sub` du JWT vérifié : le client ne choisit
    // jamais la room qu'il rejoint (sinon IDOR sur le canal privé).
    (client.data as DonneesSocket).userId = userId;
    await client.join(roomUtilisateur(userId));
    await client.join(ROOM_TIRAGES);
  }

  handleDisconnect(client: Socket): void {
    const userId = (client.data as DonneesSocket | undefined)?.userId;
    if (!userId) {
      return;
    }
    const ouvertes = this.connexionsParUtilisateur.get(userId);
    if (!ouvertes) {
      return;
    }
    ouvertes.delete(client);
    if (ouvertes.size === 0) {
      this.connexionsParUtilisateur.delete(userId);
    }
  }

  /** Ferme aussi les sockets déjà établies, pas seulement les prochaines. */
  revoquerConnexions(userId: string): void {
    const ouvertes = this.connexionsParUtilisateur.get(userId);
    if (!ouvertes) {
      return;
    }
    for (const client of ouvertes) {
      client.disconnect(true);
    }
    this.connexionsParUtilisateur.delete(userId);
  }

  // ─── Diffusion ─────────────────────────────────────────────────────────────
  emettre(room: string, evenement: string, donnees: unknown): void {
    // Le serveur n'existe pas tant que l'application n'a pas démarré :
    // une notification perdue ne doit jamais faire échouer l'appelant,
    // qui a déjà committé son écriture en base.
    if (!this.server) {
      return;
    }
    this.server.to(room).emit(evenement, donnees);
  }

  private refuser(client: Socket, motif: string): void {
    this.logger.warn(`Connexion WebSocket refusée (${motif}).`);
    client.disconnect(true);
  }

  private accepterTentative(adresse: string): boolean {
    const maintenant = Date.now();
    this.nombreTentatives += 1;
    if (this.nombreTentatives % 100 === 0) {
      for (const [ip, compteur] of this.tentativesParIp) {
        if (maintenant - compteur.debutFenetre >= FENETRE_TENTATIVES_MS) {
          this.tentativesParIp.delete(ip);
        }
      }
    }

    const compteur = this.tentativesParIp.get(adresse);
    if (
      !compteur ||
      maintenant - compteur.debutFenetre >= FENETRE_TENTATIVES_MS
    ) {
      this.tentativesParIp.set(adresse, {
        debutFenetre: maintenant,
        nombre: 1,
      });
      return true;
    }
    compteur.nombre += 1;
    return compteur.nombre <= MAX_TENTATIVES_PAR_IP_PAR_MINUTE;
  }
}

/**
 * Reproduit la règle Express `trust proxy` pour la poignée de main brute.
 * Les valeurs ajoutées par le client restent à gauche et ne sont jamais
 * retenues au-delà du nombre explicite de proxys de confiance.
 */
export function adresseClienteSocket(client: Socket): string {
  const directe = client.handshake.address || 'ip-inconnue';
  const sauts = sautsDeProxyDeConfiance();
  if (sauts === 0) {
    return directe;
  }

  const brut = client.handshake.headers['x-forwarded-for'];
  const transferees =
    typeof brut === 'string'
      ? brut
          .split(',')
          .map((valeur) => valeur.trim())
          .filter(Boolean)
      : [];
  const chaine = [...transferees, directe];
  return chaine[Math.max(chaine.length - 1 - sauts, 0)] ?? directe;
}

/**
 * Le token est lu dans le cookie de session, puis en repli dans le champ
 * `auth` de la poignée de main ou dans l'en-tête `Authorization` (voie
 * utilisée par l'extension navigateur, qui n'a pas ce cookie).
 * Volontairement jamais dans la query string : elle finit dans les
 * journaux d'accès du reverse proxy.
 *
 * L'authentification de la poignée de main devient donc partiellement
 * ambiante : ce qui ferme le détournement inter-site ici, c'est la
 * combinaison de `SameSite=Lax` (le cookie n'accompagne pas une poignée
 * de main déclenchée depuis un autre site, qui n'est pas une navigation
 * top-level) et de `poigneeDeMainAutorisee`, qui refuse effectivement la
 * connexion pour les origines same-site non déclarées, que `SameSite`
 * laisse passer.
 */
function extraireToken(client: Socket): string | null {
  const depuisCookie = lireCookieSession(client.handshake?.headers?.cookie);
  if (depuisCookie) {
    return depuisCookie;
  }

  const depuisAuth = client.handshake?.auth?.token as unknown;
  if (typeof depuisAuth === 'string' && depuisAuth.length > 0) {
    return depuisAuth;
  }

  const entete = client.handshake?.headers?.authorization;
  if (typeof entete === 'string' && entete.startsWith('Bearer ')) {
    const token = entete.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }

  return null;
}
