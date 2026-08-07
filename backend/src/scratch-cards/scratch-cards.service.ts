import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PointsTransactionType,
  RaffleStatus,
} from '../../generated/prisma/enums';

// Table de gain provisoire : le détail probabiliste (contenu possible,
// probabilités de chaque gain) reste à définir avec le client avant le
// lancement réel (docs/01-features.md, section 2). Valeurs ajustables
// sans changer la mécanique ci-dessous.
const POINTS_GAIN_CARTE = 10;

type TypeGain = 'points' | 'ticket' | 'rien';

function tirerGain(): TypeGain {
  const tirage = Math.random();
  if (tirage < 0.7) return 'points';
  if (tirage < 0.95) return 'rien';
  return 'ticket';
}

@Injectable()
export class ScratchCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(userId: string) {
    return this.prisma.scratchCard.findMany({
      where: { userId, grattee: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  async gratter(userId: string, cardId: string) {
    const carte = await this.prisma.scratchCard.findUnique({
      where: { id: cardId },
    });
    if (!carte) {
      throw new NotFoundException('Carte à gratter introuvable.');
    }
    if (carte.userId !== userId) {
      throw new ForbiddenException(
        "Cette carte n'appartient pas à l'utilisateur authentifié.",
      );
    }
    if (carte.grattee) {
      throw new ConflictException('Cette carte a déjà été grattée.');
    }

    const typeGain = tirerGain();

    return this.prisma.$transaction(async (tx) => {
      const misAJour = await tx.scratchCard.updateMany({
        where: { id: cardId, grattee: false },
        data: {
          grattee: true,
          gratteeAt: new Date(),
          gainType: typeGain,
          gainMontant: typeGain === 'points' ? POINTS_GAIN_CARTE : 0,
        },
      });
      if (misAJour.count === 0) {
        throw new ConflictException('Cette carte a déjà été grattée.');
      }

      if (typeGain === 'points') {
        await tx.pointsTransaction.create({
          data: {
            userId,
            type: PointsTransactionType.CARTE_A_GRATTER,
            montant: POINTS_GAIN_CARTE,
          },
        });
        await tx.user.update({
          where: { id: userId },
          data: { soldePoints: { increment: POINTS_GAIN_CARTE } },
        });
      }

      let ticketCree = false;
      if (typeGain === 'ticket') {
        const raffleOuvert = await tx.raffle.findFirst({
          where: { statut: RaffleStatus.OUVERT },
          orderBy: { dateTirage: 'asc' },
        });
        // Aucun tirage ouvert pour l'instant (le back-office qui les crée
        // n'existe pas encore à ce stade du projet) : le ticket ne peut
        // pas être attribué, on retombe sur un bonus de points équivalent
        // plutôt que de perdre le gain de l'utilisateur.
        if (raffleOuvert) {
          await tx.raffleTicket.create({
            data: { raffleId: raffleOuvert.id, userId },
          });
          ticketCree = true;
        } else {
          await tx.pointsTransaction.create({
            data: {
              userId,
              type: PointsTransactionType.CARTE_A_GRATTER,
              montant: POINTS_GAIN_CARTE,
            },
          });
          await tx.user.update({
            where: { id: userId },
            data: { soldePoints: { increment: POINTS_GAIN_CARTE } },
          });
        }
      }

      const carteMiseAJour = await tx.scratchCard.findUniqueOrThrow({
        where: { id: cardId },
      });

      return { carte: carteMiseAJour, ticketCree };
    });
  }
}
