import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PointsTransactionType,
  WatchSessionSource,
  WatchSessionStatus,
} from '../../generated/prisma/enums';
import { OuvrirSessionDto } from './dto/ouvrir-session.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RealtimeService } from '../realtime/realtime.service';

// ─── Constantes anti-fraude (docs/05-security.md) ────────────────────────────
/**
 * Un heartbeat est attendu toutes les 30s ; on tolère jusqu'à 3x cet
 * intervalle pour absorber la latence réseau, au-delà l'écart n'est plus
 * plausible et n'est pas crédité.
 */
const INTERVALLE_HEARTBEAT_ATTENDU_SECONDES = 30;
const INTERVALLE_MAX_PLAUSIBLE_SECONDES =
  INTERVALLE_HEARTBEAT_ATTENDU_SECONDES * 3;

// Des heartbeats reçus à un intervalle rigoureusement identique plusieurs
// fois de suite trahissent un script plutôt qu'un navigateur réel.
const SEUIL_INTERVALLES_IDENTIQUES_SUSPECTS = 5;

// ─── Barème de points de visionnage (docs/01-features.md, section 3) ─────────
const POINTS_PAR_HEURE = 10;
const HEURES_PLAFOND_BAREME = 6;
const PALIER_HEURES_BONUS = 3;
const BONUS_PALIER = 5;
const PLAFOND_POINTS_JOUR = 65;

/**
 * En V1, seule l'extension navigateur peut créditer des points. La source
 * historique LECTEUR_EMBARQUE reste reconnue pour clôturer d'anciennes
 * sessions, mais aucun lecteur n'est exposé par la vitrine.
 *
 * Liste unique volontairement : elle sert à la fois à décider du crédit
 * et à borner le cumul quotidien qui détermine le barème. Deux tests
 * séparés finiraient par diverger, et une divergence ici laisse du temps
 * non créditable financer les points d'une autre session.
 */
const SOURCES_CREDITABLES: WatchSessionSource[] = [
  WatchSessionSource.EXTENSION,
];

function estSourceCreditable(source: WatchSessionSource): boolean {
  return SOURCES_CREDITABLES.includes(source);
}

function calculerPointsDus(
  secondesValideesJour: number,
  bonusPointsHeure = 0,
): number {
  const heuresPleines = Math.min(
    Math.floor(secondesValideesJour / 3600),
    HEURES_PLAFOND_BAREME,
  );
  const points = heuresPleines * (POINTS_PAR_HEURE + bonusPointsHeure);
  const bonus = heuresPleines >= PALIER_HEURES_BONUS ? BONUS_PALIER : 0;
  return Math.min(points + bonus, PLAFOND_POINTS_JOUR);
}

function debutJournee(date: Date): Date {
  const debut = new Date(date);
  debut.setHours(0, 0, 0, 0);
  return debut;
}

@Injectable()
export class WatchSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Ouvre une session de visionnage pour la source déduite par
   * `WatchSessionCredentialGuard` du credential ayant authentifié la
   * requête (jamais d'un champ envoyé par le client). C'est cette source,
   * figée à la création et jamais réévaluée ensuite, que `heartbeat` lit
   * pour décider si l'intervalle validé peut créditer des points.
   */
  async ouvrir(
    userId: string,
    dto: OuvrirSessionDto,
    source: WatchSessionSource,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Le verrou transactionnel est partagé avec `heartbeat` : deux
      // appareils ne peuvent ni ouvrir ni créditer des sessions du même
      // compte en parallèle. Il est pris sur l'identifiant utilisateur,
      // donc il reste effectif même avec plusieurs instances du backend.
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))::text
      `;

      // Une nouvelle lecture prend la main sur l'ancienne. L'utilisateur
      // peut rester connecté sur plusieurs appareils, mais une seule
      // session de visionnage peut produire des points à un instant donné.
      await tx.watchSession.updateMany({
        where: {
          userId,
          statut: WatchSessionStatus.EN_COURS,
        },
        data: { statut: WatchSessionStatus.TERMINEE },
      });

      return tx.watchSession.create({
        data: {
          userId,
          platform: dto.platform,
          streamExternalId: dto.streamExternalId,
          source,
        },
      });
    });
  }

  async heartbeat(userId: string, sessionId: string, dto: HeartbeatDto) {
    // Toute la séquence lecture -> validation -> écriture doit rester dans
    // une seule transaction avec verrou optimiste (voir plus bas) : sinon
    // deux heartbeats envoyés en parallèle liraient le même état et
    // créditeraient chacun des points pour le même intervalle, contournant
    // le plafond quotidien que cette validation est censée faire respecter.
    const resultat = await this.prisma.$transaction(async (tx) => {
      // Sérialise tous les heartbeats d'un même compte, y compris lorsqu'ils
      // proviennent de sessions ou d'appareils différents. Le verrou
      // optimiste plus bas continue de protéger l'état de la session elle-même.
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))::text
      `;

      // Nettoie aussi les doublons historiques créés avant l'introduction
      // du verrou. La session la plus récente reste canonique ; toutes les
      // autres sont terminées avant qu'un heartbeat puisse être crédité.
      const sessionsActives = await tx.watchSession.findMany({
        where: {
          userId,
          statut: WatchSessionStatus.EN_COURS,
        },
        orderBy: [{ debutAt: 'desc' }, { id: 'desc' }],
        select: { id: true },
      });
      if (sessionsActives.length > 1) {
        const sessionCanoniqueId = sessionsActives[0].id;
        await tx.watchSession.updateMany({
          where: {
            userId,
            statut: WatchSessionStatus.EN_COURS,
            id: { not: sessionCanoniqueId },
          },
          data: { statut: WatchSessionStatus.TERMINEE },
        });
        if (sessionId !== sessionCanoniqueId) {
          return {
            session: null,
            pointsCredites: 0,
            soldePoints: null,
            refusApresCommit: 'SESSION_CONCURRENTE' as const,
          };
        }
      }

      const session = await tx.watchSession.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        throw new NotFoundException('Viewing session not found.');
      }
      if (session.userId !== userId) {
        throw new ForbiddenException(
          'This viewing session does not belong to the authenticated user.',
        );
      }
      // État ambigu (fraude déjà suspectée ou session déjà close) : refuser
      // par défaut plutôt qu'accepter (docs/05-security.md).
      if (session.statut !== WatchSessionStatus.EN_COURS) {
        throw new ForbiddenException(
          'This session no longer accepts heartbeats (status: ' +
            session.statut +
            ').',
        );
      }

      const maintenant = new Date();
      const intervalleSecondes = Math.floor(
        (maintenant.getTime() - session.dernierHeartbeatAt.getTime()) / 1000,
      );

      // Cohérence temporelle : un heartbeat ne peut avancer le compteur
      // que d'un intervalle plausible, et jamais en pause (corrélation
      // avec l'état réel du lecteur).
      const intervalleValide =
        dto.enLecture &&
        intervalleSecondes > 0 &&
        intervalleSecondes <= INTERVALLE_MAX_PLAUSIBLE_SECONDES;

      // Détection de patterns anormaux : heartbeats à intervalle
      // rigoureusement identique plusieurs fois de suite.
      const memeIntervalleQuePrecedemment =
        session.dernierIntervalleSecondes !== null &&
        session.dernierIntervalleSecondes === intervalleSecondes;
      const intervallesIdentiquesConsecutifs = memeIntervalleQuePrecedemment
        ? session.intervallesIdentiquesConsecutifs + 1
        : intervalleValide
          ? 1
          : 0;

      // Verrou optimiste : la mise à jour ne s'applique que si
      // dernierHeartbeatAt n'a pas changé depuis la lecture ci-dessus. Si
      // un autre heartbeat concurrent a déjà écrit entre-temps, count vaut
      // 0 et on refuse plutôt que de créditer deux fois le même intervalle.
      const verrouOptimiste = {
        id: sessionId,
        dernierHeartbeatAt: session.dernierHeartbeatAt,
      };

      if (
        intervallesIdentiquesConsecutifs >=
        SEUIL_INTERVALLES_IDENTIQUES_SUSPECTS
      ) {
        const { count } = await tx.watchSession.updateMany({
          where: verrouOptimiste,
          data: { statut: WatchSessionStatus.INVALIDEE },
        });
        if (count === 0) {
          throw new ConflictException(
            'Concurrent heartbeat detected; please retry.',
          );
        }
        return {
          session: null,
          pointsCredites: 0,
          soldePoints: null,
          refusApresCommit: 'PATTERN_ANORMAL' as const,
        };
      }

      if (!intervalleValide) {
        // Pas de fraude confirmée, mais rien à créditer : on resynchronise
        // simplement l'horodatage pour repartir sur une base saine.
        const { count } = await tx.watchSession.updateMany({
          where: verrouOptimiste,
          data: {
            dernierHeartbeatAt: maintenant,
            dernierIntervalleSecondes: null,
            intervallesIdentiquesConsecutifs: 0,
          },
        });
        if (count === 0) {
          throw new ConflictException(
            'Concurrent heartbeat detected; please retry.',
          );
        }
        return {
          session: null,
          pointsCredites: 0,
          soldePoints: null,
          refusApresCommit: 'INTERVALLE_INVALIDE' as const,
        };
      }

      const nouvelleDureeValidee =
        session.dureeValideeSecondes + intervalleSecondes;

      const { count } = await tx.watchSession.updateMany({
        where: verrouOptimiste,
        data: {
          dernierHeartbeatAt: maintenant,
          dureeValideeSecondes: nouvelleDureeValidee,
          dernierIntervalleSecondes: intervalleSecondes,
          intervallesIdentiquesConsecutifs,
        },
      });
      if (count === 0) {
        throw new ConflictException(
          'Concurrent heartbeat detected; please retry.',
        );
      }

      const debut = debutJournee(maintenant);
      // Seules les sessions dont la source crédite alimentent le cumul du
      // jour. Agréger aussi le lecteur embarqué laisserait son temps
      // (non crédité, et seulement déclaré par le navigateur via
      // postMessage) gonfler le barème appliqué à une session
      // d'extension ouverte juste après : quelques heartbeats suffiraient
      // alors à encaisser d'un coup le plafond quotidien.
      const sessionsDuJour = await tx.watchSession.findMany({
        where: {
          userId,
          debutAt: { gte: debut },
          source: { in: SOURCES_CREDITABLES },
        },
        select: { id: true, dureeValideeSecondes: true },
      });
      const secondesValideesJour =
        sessionsDuJour
          .filter((s) => s.id !== sessionId)
          .reduce((total, s) => total + s.dureeValideeSecondes, 0) +
        (estSourceCreditable(session.source) ? nouvelleDureeValidee : 0);

      const stream = await tx.stream.findUnique({
        where: {
          plateforme_identifiantChaine: {
            plateforme: session.platform,
            identifiantChaine: session.streamExternalId,
          },
        },
        select: { estPartenaire: true, bonusPointsHeure: true },
      });
      const bonusPointsHeure = stream?.estPartenaire
        ? stream.bonusPointsHeure
        : 0;
      const pointsDus = calculerPointsDus(
        secondesValideesJour,
        bonusPointsHeure,
      );

      const transactionsDuJour = await tx.pointsTransaction.findMany({
        where: {
          userId,
          type: PointsTransactionType.WATCH_TIME,
          createdAt: { gte: debut },
        },
        select: { montant: true },
      });
      const pointsDejaCredites = transactionsDuJour.reduce(
        (total, t) => total + t.montant,
        0,
      );
      // Le crédit V1 vient uniquement de l'extension. Les garde-fous
      // anti-fraude et le plafond quotidien restent obligatoires pour chaque
      // stream, qu'il soit partenaire ou non.
      const pointsACrediter = estSourceCreditable(session.source)
        ? Math.max(pointsDus - pointsDejaCredites, 0)
        : 0;

      // Solde après crédit, conservé pour la notification temps réel
      // émise une fois la transaction committée.
      let soldePoints: number | null = null;

      if (pointsACrediter > 0) {
        await tx.pointsTransaction.create({
          data: {
            userId,
            type: PointsTransactionType.WATCH_TIME,
            montant: pointsACrediter,
            watchSessionId: sessionId,
          },
        });
        const utilisateur = await tx.user.update({
          where: { id: userId },
          data: { soldePoints: { increment: pointsACrediter } },
        });
        soldePoints = utilisateur.soldePoints;
      }

      const sessionMiseAJour = await tx.watchSession.findUniqueOrThrow({
        where: { id: sessionId },
      });

      return {
        session: sessionMiseAJour,
        pointsCredites: pointsACrediter,
        soldePoints,
        refusApresCommit: null,
      };
    });

    // Les refus qui suivent une écriture interviennent après le commit afin
    // de conserver la clôture, l'invalidation ou la resynchronisation.
    if (resultat.refusApresCommit === 'SESSION_CONCURRENTE') {
      throw new ForbiddenException(
        'Another viewing session is active on this account.',
      );
    }
    if (resultat.refusApresCommit === 'PATTERN_ANORMAL') {
      throw new ForbiddenException(
        'Session invalidated: abnormal heartbeat pattern detected.',
      );
    }
    if (resultat.refusApresCommit === 'INTERVALLE_INVALIDE') {
      throw new BadRequestException(
        'Heartbeat rejected: implausible interval or playback is paused.',
      );
    }

    if (resultat.soldePoints !== null) {
      this.realtime.notifierPoints(userId, {
        soldePoints: resultat.soldePoints,
        montant: resultat.pointsCredites,
        type: PointsTransactionType.WATCH_TIME,
      });
    }

    return {
      session: resultat.session,
      pointsCredites: resultat.pointsCredites,
    };
  }

  async fermer(userId: string, sessionId: string) {
    const session = await this.prisma.watchSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Viewing session not found.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException(
        'This viewing session does not belong to the authenticated user.',
      );
    }

    return this.prisma.watchSession.update({
      where: { id: sessionId },
      data: { statut: WatchSessionStatus.TERMINEE },
    });
  }
}
