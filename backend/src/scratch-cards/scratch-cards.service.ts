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
import { RealtimeService } from '../realtime/realtime.service';
import { randomInt } from 'node:crypto';

// Table de gain provisoire : le détail probabiliste (contenu possible,
// probabilités de chaque gain) reste à définir avec le client avant le
// lancement réel (docs/01-features.md, section 2). Valeurs ajustables
// sans changer la mécanique ci-dessous.
const POINTS_GAIN_CARTE = 10;

type TypeGain = 'points' | 'ticket' | 'rien';

function tirerGain(): TypeGain {
  const tirage = randomInt(100);
  if (tirage < 70) return 'points';
  if (tirage < 95) return 'rien';
  return 'ticket';
}

@Injectable()
export class ScratchCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

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
      throw new NotFoundException('Scratch card not found.');
    }
    if (carte.userId !== userId) {
      throw new ForbiddenException(
        'This scratch card does not belong to the authenticated user.',
      );
    }
    if (carte.grattee) {
      throw new ConflictException(
        'This scratch card has already been scratched.',
      );
    }

    const typeGain = tirerGain();

    const resultat = await this.prisma.$transaction(async (tx) => {
      // Solde après crédit, conservé pour la notification temps réel
      // émise une fois la transaction committée.
      let soldePoints: number | null = null;
      let pointsCredites = 0;

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
        throw new ConflictException(
          'This scratch card has already been scratched.',
        );
      }

      if (typeGain === 'points') {
        await tx.pointsTransaction.create({
          data: {
            userId,
            type: PointsTransactionType.CARTE_A_GRATTER,
            montant: POINTS_GAIN_CARTE,
          },
        });
        const utilisateur = await tx.user.update({
          where: { id: userId },
          data: { soldePoints: { increment: POINTS_GAIN_CARTE } },
        });
        soldePoints = utilisateur.soldePoints;
        pointsCredites = POINTS_GAIN_CARTE;
      }

      let ticketCree = false;
      if (typeGain === 'ticket') {
        // `dateTirage` encore à venir en plus du statut OUVERT : un
        // tirage dont l'heure est dépassée est sur le point d'être
        // exécuté par le job planifié. Y ajouter un ticket ferait entrer
        // le porteur dans un tirage déjà en cours de clôture, ticket qui
        // ne serait jamais tiré et qui ferait diverger la liste des
        // participants de l'empreinte publiée avec le résultat.
        const raffleOuvert = await tx.raffle.findFirst({
          where: {
            statut: RaffleStatus.OUVERT,
            dateTirage: { gt: new Date() },
          },
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
          const utilisateur = await tx.user.update({
            where: { id: userId },
            data: { soldePoints: { increment: POINTS_GAIN_CARTE } },
          });
          soldePoints = utilisateur.soldePoints;
          pointsCredites = POINTS_GAIN_CARTE;
        }
      }

      const carteMiseAJour = await tx.scratchCard.findUniqueOrThrow({
        where: { id: cardId },
      });

      return { carte: carteMiseAJour, ticketCree, soldePoints, pointsCredites };
    });

    if (resultat.soldePoints !== null) {
      this.realtime.notifierPoints(userId, {
        soldePoints: resultat.soldePoints,
        montant: resultat.pointsCredites,
        type: PointsTransactionType.CARTE_A_GRATTER,
      });
    }

    return { carte: resultat.carte, ticketCree: resultat.ticketCree };
  }
}
