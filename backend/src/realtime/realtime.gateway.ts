import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
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
 * Origines autorisées pour la poignée de main. Non renseigné, Socket.io
 * refuse toute origine tierce : c'est le défaut voulu, on n'ouvre que ce
 * qui est explicitement déclaré.
 */
function originesAutorisees(): string[] | false {
  const brut = process.env.CORS_ORIGINS?.trim();
  if (!brut) {
    return false;
  }
  return brut
    .split(',')
    .map((origine) => origine.trim())
    .filter((origine) => origine.length > 0);
}

@WebSocketGateway({
  cors: { origin: originesAutorisees(), credentials: true },
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
 * Le token est lu dans le champ `auth` de la poignée de main ou dans
 * l'en-tête `Authorization`. Volontairement pas dans la query string :
 * elle finit dans les journaux d'accès du reverse proxy.
 */
function extraireToken(client: Socket): string | null {
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
