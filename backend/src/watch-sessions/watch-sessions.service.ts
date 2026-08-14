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
  WatchSessionStatus,
} from '../../generated/prisma/enums';
import { OuvrirSessionDto } from './dto/ouvrir-session.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RealtimeService } from '../realtime/realtime.service';

// ==================== CONSTANTES ANTI-FRAUDE (DOCS/05-SECURITY.MD) ====================

// Un heartbeat est attendu toutes les 30s ; on tolère jusqu'à 3x cet
// intervalle pour absorber la latence réseau, au-delà l'écart n'est plus
// plausible et n'est pas crédité.
const INTERVALLE_HEARTBEAT_ATTENDU_SECONDES = 30;
const INTERVALLE_MAX_PLAUSIBLE_SECONDES =
  INTERVALLE_HEARTBEAT_ATTENDU_SECONDES * 3;

// Des heartbeats reçus à un intervalle rigoureusement identique plusieurs
// fois de suite trahissent un script plutôt qu'un navigateur réel.
const SEUIL_INTERVALLES_IDENTIQUES_SUSPECTS = 5;

// ==================== BARÈME DE POINTS DE VISIONNAGE (DOCS/01-FEATURES.MD, SECTION 3) ====================

const POINTS_PAR_HEURE = 10;
const HEURES_PLAFOND_BAREME = 6;
const PALIER_HEURES_BONUS = 3;
const BONUS_PALIER = 5;
const PLAFOND_POINTS_JOUR = 65;

function calculerPointsDus(secondesValideesJour: number): number {
  const heuresPleines = Math.min(
    Math.floor(secondesValideesJour / 3600),
    HEURES_PLAFOND_BAREME,
  );
  const points = heuresPleines * POINTS_PAR_HEURE;
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

  async ouvrir(userId: string, dto: OuvrirSessionDto) {
    return this.prisma.watchSession.create({
      data: {
        userId,
        platform: dto.platform,
        streamExternalId: dto.streamExternalId,
        source: dto.source,
      },
    });
  }

  async heartbeat(userId: string, sessionId: string, dto: HeartbeatDto) {
    // Toute la séquence lecture -> validation -> écriture doit rester dans
    // une seule transaction avec verrou optimiste (voir plus bas) : sinon
    // deux heartbeats envoyés en parallèle liraient le même état et
    // créditeraient chacun des points pour le même intervalle, contournant
    // le plafond quotidien que cette validation est censée faire respecter.
    const resultat = await this.prisma.$transaction(async (tx) => {
      const session = await tx.watchSession.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        throw new NotFoundException('Session de visionnage introuvable.');
      }
      if (session.userId !== userId) {
        throw new ForbiddenException(
          "Cette session n'appartient pas à l'utilisateur authentifié.",
        );
      }
      // État ambigu (fraude déjà suspectée ou session déjà close) : refuser
      // par défaut plutôt qu'accepter (docs/05-security.md).
      if (session.statut !== WatchSessionStatus.EN_COURS) {
        throw new ForbiddenException(
          "Cette session n'accepte plus de heartbeat (statut : " +
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
            'Heartbeat concurrent détecté, réessayer.',
          );
        }
        throw new ForbiddenException(
          'Session invalidée : pattern de heartbeats anormal détecté.',
        );
      }

      if (!intervalleValide) {
        // Pas de fraude confirmée, mais rien à créditer : on resynchronise
        // simplement l'horodatage pour repartir sur une base saine.
        await tx.watchSession.updateMany({
          where: verrouOptimiste,
          data: {
            dernierHeartbeatAt: maintenant,
            dernierIntervalleSecondes: null,
            intervallesIdentiquesConsecutifs: 0,
          },
        });
        throw new BadRequestException(
          'Heartbeat rejeté : intervalle non plausible ou lecture en pause.',
        );
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
        throw new ConflictException('Heartbeat concurrent détecté, réessayer.');
      }

      const debut = debutJournee(maintenant);
      const sessionsDuJour = await tx.watchSession.findMany({
        where: { userId, debutAt: { gte: debut } },
        select: { id: true, dureeValideeSecondes: true },
      });
      const secondesValideesJour =
        sessionsDuJour
          .filter((s) => s.id !== sessionId)
          .reduce((total, s) => total + s.dureeValideeSecondes, 0) +
        nouvelleDureeValidee;

      const pointsDus = calculerPointsDus(secondesValideesJour);

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
      const pointsACrediter = Math.max(pointsDus - pointsDejaCredites, 0);

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
      };
    });

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
      throw new NotFoundException('Session de visionnage introuvable.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException(
        "Cette session n'appartient pas à l'utilisateur authentifié.",
      );
    }

    return this.prisma.watchSession.update({
      where: { id: sessionId },
      data: { statut: WatchSessionStatus.TERMINEE },
    });
  }
}
