import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsTransactionType } from '../../generated/prisma/enums';

// Montant crédité par visite quotidienne. Le montant définitif reste à
// finaliser avec le client (docs/01-features.md, section 2) : valeur
// provisoire, à ajuster sans changer la mécanique ci-dessous.
const POINTS_VISITE_QUOTIDIENNE = 5;

// Paliers de streak débloquant une carte à gratter. Paliers évoqués par
// le client (1, 3, 7, 14, 30 jours) mais pas encore finalisés :
// provisoire, à ajuster sans changer la mécanique ci-dessous.
const PALIERS_STREAK_CARTE_A_GRATTER = [1, 3, 7, 14, 30];

function debutJournee(date: Date): Date {
  const debut = new Date(date);
  debut.setHours(0, 0, 0, 0);
  return debut;
}

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async checkinQuotidien(userId: string) {
    const utilisateur = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const maintenant = new Date();
    const debutAujourdhui = debutJournee(maintenant);

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

    const nouveauStreak = visiteConsecutive ? utilisateur.streakActuel + 1 : 1;

    return this.prisma.$transaction(async (tx) => {
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
  }
}
