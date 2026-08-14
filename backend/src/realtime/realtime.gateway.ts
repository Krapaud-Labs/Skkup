import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { lireCookieSession } from '../auth/cookie-session';
import { originesAutorisees } from '../common/cors';
import { ROOM_TIRAGES, roomUtilisateur } from './realtime.constants';

// ---------------------------------------------------------------------
// Gateway WebSocket (Socket.io)
//
// Canal de notification uniquement : tout ce qui est poussé ici a déjà
// été persisté en base (PostgreSQL reste la source de vérité). Aucune
// donnée sensible (mot de passe, token OAuth) n'y transite.
// ---------------------------------------------------------------------

/**
 * Plafond de connexions simultanées par utilisateur. Un onglet par
 * appareil plus quelques reconnexions en vol suffisent largement :
 * au-delà, c'est une tentative de saturation (docs/05-security.md,
 * menace 4) et on refuse.
 */
const MAX_CONNEXIONS_PAR_UTILISATEUR = 10;

interface PayloadJwt {
  sub?: unknown;
  email?: unknown;
}

// Données attachées à la socket côté serveur uniquement : le client n'y
// a jamais accès en écriture.
interface DonneesSocket {
  userId?: string;
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

@WebSocketGateway({
  cors: { origin: originesAutorisees(), credentials: true },
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
  private readonly connexionsParUtilisateur = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  // --- Poignée de main ---

  async handleConnection(client: Socket): Promise<void> {
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
    } catch {
      // Signature invalide, token expiré, format inattendu : dans le
      // doute on refuse, jamais de canal anonyme.
      this.refuser(client, 'token invalide');
      return;
    }

    const ouvertes =
      this.connexionsParUtilisateur.get(userId) ?? new Set<string>();
    if (ouvertes.size >= MAX_CONNEXIONS_PAR_UTILISATEUR) {
      this.refuser(client, 'trop de connexions simultanées');
      return;
    }
    ouvertes.add(client.id);
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
    ouvertes.delete(client.id);
    if (ouvertes.size === 0) {
      this.connexionsParUtilisateur.delete(userId);
    }
  }

  // --- Diffusion ---

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
 * top-level) et de la vérification d'origine ci-dessus, qui cesse d'être
 * une simple défense en profondeur.
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
