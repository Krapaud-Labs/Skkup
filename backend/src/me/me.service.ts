import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PointsTransactionType,
  RaffleStatus,
} from '../../generated/prisma/enums';
import { RealtimeService } from '../realtime/realtime.service';

// Montant crédité par visite quotidienne.
const POINTS_VISITE_QUOTIDIENNE = 5;

// Les cartes suivent la progression demandée : 3, 7, 14 et 30 jours. À partir
// de 40 jours, un palier de dix jours prépare
// une récompense ticket au lieu d'ajouter une carte à chaque connexion.
const PALIERS_STREAK_CARTE_A_GRATTER = [3, 7, 14, 30];

function palierTicket(streak: number): boolean {
  return streak > 30 && streak % 10 === 0;
}

// Pagination par défaut de l'historique de points.
const HISTORIQUE_LIMITE_PAR_DEFAUT = 20;
const HISTORIQUE_LIMITE_MAX = 100;

// Pagination par défaut des tickets de tirage de l'utilisateur.
const TICKETS_LIMITE_PAR_DEFAUT = 20;
const TICKETS_LIMITE_MAX = 100;
const RESUME_LIMITE_PAR_DEFAUT = 6;
const RESUME_LIMITE_MAX = 20;

function debutJournee(date: Date): Date {
  const debut = new Date(date);
  debut.setHours(0, 0, 0, 0);
  return debut;
}

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  // ─── Profil ────────────────────────────────────────────────────────────────
  async profil(userId: string) {
    // Sélection explicite des champs : le passwordHash ne doit jamais
    // sortir du service, même par inadvertance.
    const utilisateur = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        pseudo: true,
        role: true,
        soldePoints: true,
        streakActuel: true,
        streakMax: true,
        derniereVisiteAt: true,
        createdAt: true,
      },
    });
    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return utilisateur;
  }

  /**
   * Contrat de lecture unique pour le dashboard viewer V3.
   * Les compteurs sont bornés à l'utilisateur authentifié et les sessions
   * sont agrégées côté base afin d'éviter de reconstruire le temps de
   * visionnage dans le client.
   */
  async resumeDashboard(userId: string) {
    const [profil, sessions, transactions, sessionsRecentes, tickets, cartes] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            pseudo: true,
            soldePoints: true,
            streakActuel: true,
            streakMax: true,
            derniereVisiteAt: true,
          },
        }),
        this.prisma.watchSession.aggregate({
          where: { userId },
          _sum: { dureeValideeSecondes: true },
          _count: { _all: true },
        }),
        this.prisma.pointsTransaction.findMany({
          where: {
            userId,
            OR: [
              { type: { not: PointsTransactionType.WATCH_TIME } },
              {
                type: PointsTransactionType.WATCH_TIME,
                watchSessionId: null,
              },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            watchSessionId: true,
            type: true,
            montant: true,
            createdAt: true,
            watchSession: {
              select: {
                platform: true,
                streamExternalId: true,
                dureeValideeSecondes: true,
              },
            },
          },
        }),
        this.prisma.watchSession.findMany({
          where: { userId, dureeValideeSecondes: { gt: 0 } },
          orderBy: { dernierHeartbeatAt: 'desc' },
          take: 5,
          select: {
            id: true,
            dernierHeartbeatAt: true,
            platform: true,
            streamExternalId: true,
            dureeValideeSecondes: true,
          },
        }),
        this.prisma.raffleTicket.count({ where: { userId } }),
        this.prisma.scratchCard.count({ where: { userId, grattee: false } }),
      ]);

    if (!profil) throw new NotFoundException('Utilisateur introuvable.');

    const creditsWatchTime = sessionsRecentes.length
      ? await this.prisma.pointsTransaction.groupBy({
          by: ['watchSessionId'],
          where: {
            userId,
            type: PointsTransactionType.WATCH_TIME,
            watchSessionId: {
              in: sessionsRecentes.map((session) => session.id),
            },
          },
          _sum: { montant: true },
        })
      : [];
    const creditsParSession = new Map(
      creditsWatchTime.map((credit) => [
        credit.watchSessionId,
        credit._sum.montant ?? 0,
      ]),
    );
    const activitesTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      montant: transaction.montant,
      createdAt: transaction.createdAt,
      session: transaction.watchSession,
    }));
    const activitesSessions = sessionsRecentes.map((session) => ({
      id: `watch-session:${session.id}`,
      type: PointsTransactionType.WATCH_TIME,
      montant: creditsParSession.get(session.id) ?? 0,
      createdAt: session.dernierHeartbeatAt,
      session: {
        platform: session.platform,
        streamExternalId: session.streamExternalId,
        dureeValideeSecondes: session.dureeValideeSecondes,
      },
    }));

    return {
      profil,
      visionnage: {
        secondesValidees: sessions._sum.dureeValideeSecondes ?? 0,
        sessions: sessions._count._all,
      },
      activite: {
        ticketsTirage: tickets,
        cartesAGratterDisponibles: cartes,
      },
      // Une activité représente une session de visionnage avec la somme de
      // tous ses crédits WATCH_TIME liés. Les autres transactions restent
      // individuelles. Un montant nul est seulement informatif et ne crée
      // ni ligne de ledger ni modification du solde.
      transactionsRecentes: [...activitesTransactions, ...activitesSessions]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    };
  }

  // ─── Historique de points ──────────────────────────────────────────────────
  async historiquePoints(userId: string, page?: number, limit?: number) {
    const pageCourante = page && page > 0 ? page : 1;
    const taillePage = Math.min(
      limit && limit > 0 ? limit : HISTORIQUE_LIMITE_PAR_DEFAUT,
      HISTORIQUE_LIMITE_MAX,
    );

    // Le filtre porte toujours sur l'utilisateur authentifié : aucun
    // identifiant fourni par le client n'entre dans cette requête.
    const where = { userId };

    const [transactions, total] = await Promise.all([
      this.prisma.pointsTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageCourante - 1) * taillePage,
        take: taillePage,
      }),
      this.prisma.pointsTransaction.count({ where }),
    ]);

    return {
      transactions,
      page: pageCourante,
      limit: taillePage,
      total,
      totalPages: Math.ceil(total / taillePage),
    };
  }

  /**
   * Agrégat de lecture pour le dashboard viewer.
   *
   * Il ne remplace pas les contrats paginés : il évite simplement que la
   * page Récompenses fasse plusieurs lectures indépendantes et affiche des
   * blocs provenant d'instantanés différents. Toutes les données sont
   * filtrées par l'utilisateur authentifié.
   */
  async resumeRecompenses(userId: string, limit?: number) {
    const taille = Math.min(
      limit && limit > 0 ? limit : RESUME_LIMITE_PAR_DEFAUT,
      RESUME_LIMITE_MAX,
    );

    const [profil, cartes, transactions, tickets] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          pseudo: true,
          soldePoints: true,
          streakActuel: true,
          streakMax: true,
        },
      }),
      this.prisma.scratchCard.findMany({
        where: { userId, grattee: false },
        orderBy: { createdAt: 'desc' },
        take: taille,
      }),
      this.prisma.pointsTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: taille,
      }),
      this.prisma.raffleTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: taille,
        include: {
          raffle: { select: { id: true, titre: true, statut: true } },
          winner: { select: { lot: { select: { id: true, nom: true } } } },
        },
      }),
    ]);

    if (!profil) throw new NotFoundException('Utilisateur introuvable.');

    return {
      profil,
      cartes,
      transactions,
      tickets: tickets.map((ticket) => ({
        ticketId: ticket.id,
        raffleId: ticket.raffle.id,
        raffleTitre: ticket.raffle.titre,
        raffleStatut: ticket.raffle.statut,
        obtenuLe: ticket.createdAt,
        gagnant: ticket.winner !== null,
        lot: ticket.winner
          ? { id: ticket.winner.lot.id, nom: ticket.winner.lot.nom }
          : null,
      })),
      limite: taille,
    };
  }

  // ─── Tickets de tirage ─────────────────────────────────────────────────────
  /**
   * Liste les tickets de tirage obtenus par l'utilisateur authentifié,
   * avec le statut du tirage associé et, s'il a déjà eu lieu, le résultat
   * (gagnant ou non). Le filtre porte toujours sur l'utilisateur du JWT,
   * jamais sur un identifiant fourni par le client.
   */
  async mesTicketsTirage(userId: string, page?: number, limit?: number) {
    const pageCourante = page && page > 0 ? page : 1;
    const taillePage = Math.min(
      limit && limit > 0 ? limit : TICKETS_LIMITE_PAR_DEFAUT,
      TICKETS_LIMITE_MAX,
    );

    const where = { userId };

    const [tickets, total] = await Promise.all([
      this.prisma.raffleTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageCourante - 1) * taillePage,
        take: taillePage,
        include: {
          raffle: { select: { id: true, titre: true, statut: true } },
          winner: {
            select: {
              lot: { select: { id: true, nom: true } },
            },
          },
        },
      }),
      this.prisma.raffleTicket.count({ where }),
    ]);

    return {
      tickets: tickets.map((ticket) => ({
        ticketId: ticket.id,
        raffleId: ticket.raffle.id,
        raffleTitre: ticket.raffle.titre,
        raffleStatut: ticket.raffle.statut,
        obtenuLe: ticket.createdAt,
        gagnant: ticket.winner !== null,
        lot: ticket.winner
          ? { id: ticket.winner.lot.id, nom: ticket.winner.lot.nom }
          : null,
      })),
      page: pageCourante,
      limit: taillePage,
      total,
      totalPages: Math.ceil(total / taillePage),
    };
  }

  async inscrireTirage(userId: string, raffleId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId + raffleId}, 0))::text`;
      const raffle = await tx.raffle.findUnique({
        where: { id: raffleId },
        select: {
          id: true,
          statut: true,
          dateOuverture: true,
          dateTirage: true,
        },
      });
      if (!raffle) throw new NotFoundException('Raffle not found.');
      const maintenant = new Date();
      if (
        raffle.statut !== RaffleStatus.OUVERT ||
        raffle.dateOuverture > maintenant ||
        raffle.dateTirage <= maintenant
      ) {
        throw new ConflictException(
          'This raffle is not open for registration.',
        );
      }
      const existant = await tx.raffleTicket.findFirst({
        where: { raffleId, userId },
        select: { id: true },
      });
      if (existant)
        throw new ConflictException(
          'You are already registered for this raffle.',
        );
      const ticket = await tx.raffleTicket.create({
        data: { raffleId, userId },
      });
      return { ticketId: ticket.id, raffleId: ticket.raffleId };
    });
  }

  // ─── Visite quotidienne ────────────────────────────────────────────────────
  async checkinQuotidien(userId: string) {
    const maintenant = new Date();
    const debutAujourdhui = debutJournee(maintenant);

    const resultat = await this.prisma.$transaction(async (tx) => {
      // Sérialise la lecture et la décision d'éligibilité pour ce compte,
      // y compris avec plusieurs instances du backend.
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))::text
      `;

      const utilisateur = await tx.user.findUnique({
        where: { id: userId },
      });
      if (!utilisateur) {
        throw new NotFoundException('Utilisateur introuvable.');
      }

      if (
        utilisateur.derniereVisiteAt &&
        utilisateur.derniereVisiteAt >= debutAujourdhui
      ) {
        throw new ConflictException("Visite déjà enregistrée aujourd'hui.");
      }

      const debutHier = new Date(debutAujourdhui);
      debutHier.setDate(debutHier.getDate() - 1);
      const visiteConsecutive =
        utilisateur.derniereVisiteAt !== null &&
        utilisateur.derniereVisiteAt >= debutHier &&
        utilisateur.derniereVisiteAt < debutAujourdhui;

      const nouveauStreak = visiteConsecutive
        ? utilisateur.streakActuel + 1
        : 1;

      const utilisateurMisAJour = await tx.user.update({
        where: { id: userId },
        data: {
          derniereVisiteAt: maintenant,
          streakActuel: nouveauStreak,
          streakMax: Math.max(utilisateur.streakMax, nouveauStreak),
          soldePoints: { increment: POINTS_VISITE_QUOTIDIENNE },
        },
      });

      await tx.pointsTransaction.create({
        data: {
          userId,
          type: PointsTransactionType.VISITE_QUOTIDIENNE,
          montant: POINTS_VISITE_QUOTIDIENNE,
        },
      });

      const carteDebloquee =
        PALIERS_STREAK_CARTE_A_GRATTER.includes(nouveauStreak) ||
        palierTicket(nouveauStreak)
          ? await tx.scratchCard.create({
              data: {
                userId,
                streakPalier: nouveauStreak,
                ...(palierTicket(nouveauStreak)
                  ? { gainType: 'TICKET', gainMontant: 1 }
                  : {}),
              },
            })
          : null;

      return {
        streakActuel: utilisateurMisAJour.streakActuel,
        streakMax: utilisateurMisAJour.streakMax,
        soldePoints: utilisateurMisAJour.soldePoints,
        pointsCredites: POINTS_VISITE_QUOTIDIENNE,
        carteDebloquee,
      };
    });

    // Notifications émises seulement après le commit : le temps réel ne
    // fait qu'annoncer ce qui est déjà en base.
    this.realtime.notifierPoints(userId, {
      soldePoints: resultat.soldePoints,
      montant: resultat.pointsCredites,
      type: PointsTransactionType.VISITE_QUOTIDIENNE,
    });
    this.realtime.notifierStreak(userId, {
      streakActuel: resultat.streakActuel,
      streakMax: resultat.streakMax,
    });
    if (resultat.carteDebloquee) {
      this.realtime.notifierCarteDebloquee(userId, {
        carteId: resultat.carteDebloquee.id,
        streakPalier: resultat.carteDebloquee.streakPalier,
      });
    }

    return resultat;
  }
}
