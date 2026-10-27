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

// Récompenses modérées, proportionnelles à la continuité du streak.
// Les paliers ticket sont marqués directement sur la carte lors du check-in.
const POINTS_GAIN_CARTE_PAR_PALIER: Record<number, number> = {
  3: 10,
  7: 15,
  14: 25,
  30: 40,
};
const POINTS_GAIN_CARTE_DEFAUT = 10;

function pointsPourPalier(streakPalier: number): number {
  return POINTS_GAIN_CARTE_PAR_PALIER[streakPalier] ?? POINTS_GAIN_CARTE_DEFAUT;
}

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
    const cartes = await this.prisma.scratchCard.findMany({
      where: { userId, grattee: false },
      orderBy: { createdAt: 'asc' },
    });
    // A reserved result is returned only to the prepare request that opened
    // the scratch modal. A page refresh or ordinary list request must not
    // disclose it before the user resumes the same card.
    return cartes.map((carte) =>
      carte.gainPrepareAt
        ? { ...carte, gainType: null, gainMontant: null, gainPrepareAt: null }
        : carte,
    );
  }

  async preparer(userId: string, cardId: string) {
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
    if (carte.gainPrepareAt) {
      return { carte: { ...carte, gainType: carte.gainType?.toLowerCase() ?? null } };
    }

    const pointsGain = pointsPourPalier(carte.streakPalier);
    let typeGain: TypeGain = carte.gainType === 'TICKET' ? 'ticket' : tirerGain();
    if (typeGain === 'ticket') {
      const tirageOuvert = await this.prisma.raffle.findFirst({
        where: {
          statut: RaffleStatus.OUVERT,
          dateTirage: { gt: new Date() },
        },
        select: { id: true },
        orderBy: { dateTirage: 'asc' },
      });
      if (!tirageOuvert) typeGain = 'points';
    }

    const gainTypePrepare = typeGain.toUpperCase();
    const gainMontantPrepare = typeGain === 'points' ? pointsGain : typeGain === 'ticket' ? 1 : 0;
    const marqueurPreparation = new Date();
    const miseAJour = await this.prisma.scratchCard.updateMany({
      where: { id: cardId, userId, grattee: false, gainPrepareAt: null },
      data: {
        gainType: gainTypePrepare,
        gainMontant: gainMontantPrepare,
        gainPrepareAt: marqueurPreparation,
      },
    });

    // A concurrent prepare request may have won the compare-and-set above.
    // Re-read its selected result instead of generating or exposing a second.
    const preparee = await this.prisma.scratchCard.findUnique({
      where: { id: cardId },
    });
    if (!preparee) {
      throw new NotFoundException('Carte à gratter introuvable.');
    }
    if (preparee.grattee) {
      throw new ConflictException('Cette carte a déjà été grattée.');
    }
    if (!preparee.gainPrepareAt) {
      throw new ConflictException('La carte n’a pas pu être préparée.');
    }
    return { carte: { ...preparee, gainType: preparee.gainType?.toLowerCase() ?? null } };
  }

  async gratter(userId: string, cardId: string) {
    // Preserve the legacy one-request API for existing clients. New clients
    // prepare the result when opening the modal and call this only at 90%.
    await this.preparer(userId, cardId);
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

    const typeGainReserve: TypeGain = carte.gainType === 'TICKET'
      ? 'ticket'
      : carte.gainType === 'RIEN'
        ? 'rien'
        : 'points';
    // A reserved ticket uses gainMontant=1 as its ticket marker. If the
    // raffle closes before finalization, its fallback value must come from
    // the card's streak tier rather than that marker.
    const pointsGain =
      typeGainReserve === 'ticket'
        ? pointsPourPalier(carte.streakPalier)
        : carte.gainMontant ?? pointsPourPalier(carte.streakPalier);

    const resultat = await this.prisma.$transaction(async (tx) => {
      // Solde après crédit, conservé pour la notification temps réel
      // émise une fois la transaction committée.
      let soldePoints: number | null = null;
      let pointsCredites = 0;
      let typeGain = typeGainReserve;
      let raffleOuvert: { id: string } | null = null;
      if (typeGain === 'ticket') {
        raffleOuvert = await tx.raffle.findFirst({
          where: {
            statut: RaffleStatus.OUVERT,
            dateTirage: { gt: new Date() },
          },
          select: { id: true },
          orderBy: { dateTirage: 'asc' },
        });
        // The raffle may have closed while the user was scratching. Preserve
        // the value of the card by converting the reserved ticket to points.
        if (!raffleOuvert) typeGain = 'points';
      }

      const misAJour = await tx.scratchCard.updateMany({
        where: { id: cardId, grattee: false },
        data: {
          grattee: true,
          gratteeAt: new Date(),
          gainType: typeGain,
          gainMontant: typeGain === 'points' ? pointsGain : 0,
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
            montant: pointsGain,
          },
        });
        const utilisateur = await tx.user.update({
          where: { id: userId },
          data: { soldePoints: { increment: pointsGain } },
        });
        soldePoints = utilisateur.soldePoints;
        pointsCredites = pointsGain;
      }

      let ticketCree = false;
      if (typeGain === 'ticket') {
        // `dateTirage` encore à venir en plus du statut OUVERT : un
        // tirage dont l'heure est dépassée est sur le point d'être
        // exécuté par le job planifié. Y ajouter un ticket ferait entrer
        // le porteur dans un tirage déjà en cours de clôture, ticket qui
        // ne serait jamais tiré et qui ferait diverger la liste des
        // participants de l'empreinte publiée avec le résultat.
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
              montant: pointsGain,
            },
          });
          const utilisateur = await tx.user.update({
            where: { id: userId },
            data: { soldePoints: { increment: pointsGain } },
          });
          soldePoints = utilisateur.soldePoints;
          pointsCredites = pointsGain;
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
