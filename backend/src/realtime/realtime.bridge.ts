import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import IORedis from 'ioredis';
import {
  CANAL_REDIS_TEMPS_REEL,
  EVENEMENTS_AUTORISES,
  MessageTempsReel,
  ROOM_TIRAGES,
} from './realtime.constants';
import { RealtimeGateway } from './realtime.gateway';

// ─── Pont Redis worker -> Gateway ────────────────────────────────────────────
/**
 * Le worker BullMQ tourne dans un processus distinct et n'héberge aucun
 * serveur Socket.io : il publie ses notifications sur un canal Redis que
 * le processus API relaie aux clients connectés.
 */

/**
 * Publie une notification depuis un processus sans serveur Socket.io
 * (worker BullMQ). L'échec de publication est volontairement silencieux
 * côté appelant : le temps réel est un confort, il ne doit jamais faire
 * échouer un traitement déjà persisté en base.
 */
export async function publierEvenementTempsReel(
  redis: Pick<IORedis, 'publish'>,
  message: MessageTempsReel,
): Promise<void> {
  await redis.publish(CANAL_REDIS_TEMPS_REEL, JSON.stringify(message));
}

/**
 * Un message ne peut viser que la room commune des tirages ou une room
 * privée `user:<id>`, et ne peut porter qu'un nom d'événement connu :
 * défense en profondeur si quelqu'un obtenait un accès en écriture au
 * canal Redis.
 */
export function messageTempsReelValide(
  message: unknown,
): message is MessageTempsReel {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  const candidat = message as Partial<MessageTempsReel>;
  if (
    typeof candidat.room !== 'string' ||
    typeof candidat.evenement !== 'string'
  ) {
    return false;
  }
  if (!EVENEMENTS_AUTORISES.includes(candidat.evenement)) {
    return false;
  }
  // Longueur bornée : un identifiant est un cuid (25 caractères), la
  // marge est large. Sans borne, un message forgé pourrait faire créer
  // une room dont le nom pèse plusieurs mégaoctets dans l'index des
  // rooms de Socket.io.
  return (
    candidat.room === ROOM_TIRAGES ||
    /^user:[A-Za-z0-9_-]{1,64}$/.test(candidat.room)
  );
}

@Injectable()
export class RealtimeBridge implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeBridge.name);
  private abonne: IORedis | null = null;

  constructor(private readonly gateway: RealtimeGateway) {}

  async onModuleInit(): Promise<void> {
    // Une connexion Redis en mode « subscribe » est dédiée : elle ne
    // peut plus servir à autre chose une fois abonnée.
    this.abonne = new IORedis(process.env.REDIS_URL ?? 'redis://redis:6379');
    this.abonne.on('error', (erreur) => {
      this.logger.error(
        `Connexion Redis du pont temps réel : ${erreur.message}`,
      );
    });
    this.abonne.on('message', (_canal, charge) => this.relayer(charge));
    await this.abonne.subscribe(CANAL_REDIS_TEMPS_REEL);
  }

  async onModuleDestroy(): Promise<void> {
    await this.abonne?.quit();
    this.abonne = null;
  }

  private relayer(charge: string): void {
    let message: unknown;
    try {
      message = JSON.parse(charge);
    } catch {
      this.logger.warn('Message temps réel illisible ignoré.');
      return;
    }
    if (!messageTempsReelValide(message)) {
      this.logger.warn('Message temps réel non conforme ignoré.');
      return;
    }
    this.gateway.emettre(message.room, message.evenement, message.donnees);
  }
}
