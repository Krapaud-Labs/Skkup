import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsTransactionType } from '../../generated/prisma/enums';
import { RealtimeService } from '../realtime/realtime.service';

// Montant crédité par visite quotidienne. Le montant définitif reste à
// finaliser avec le client (docs/01-features.md, section 2) : valeur
// provisoire, à ajuster sans changer la mécanique ci-dessous.
const POINTS_VISITE_QUOTIDIENNE = 5;

// Paliers de streak débloquant une carte à gratter. Paliers évoqués par
// le client (1, 3, 7, 14, 30 jours) mais pas encore finalisés :
// provisoire, à ajuster sans changer la mécanique ci-dessous.
const PALIERS_STREAK_CARTE_A_GRATTER = [1, 3, 7, 14, 30];

// Pagination par défaut de l'historique de points.
const HISTORIQUE_LIMITE_PAR_DEFAUT = 20;
const HISTORIQUE_LIMITE_MAX = 100;

// Pagination par défaut des tickets de tirage de l'utilisateur.
const TICKETS_LIMITE_PAR_DEFAUT = 20;
const TICKETS_LIMITE_MAX = 100;

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

      const carteDebloquee = PALIERS_STREAK_CARTE_A_GRATTER.includes(
        nouveauStreak,
      )
        ? await tx.scratchCard.create({
            data: { userId, streakPalier: nouveauStreak },
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
