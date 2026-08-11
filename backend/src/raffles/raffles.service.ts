import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RaffleStatus } from '../../generated/prisma/enums';

// Ces endpoints sont publics (les tirages et leurs résultats sont
// affichés sur le site sans compte). On n'expose donc jamais d'identité
// technique : côté gagnants, seuls le pseudo et l'identifiant du ticket
// sortent, pas l'email ni l'identifiant utilisateur.
@Injectable()
export class RafflesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Liste publique ---
  async lister() {
    const raffles = await this.prisma.raffle.findMany({
      orderBy: { dateTirage: 'desc' },
      include: {
        lots: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            nom: true,
            valeurEstimee: true,
            quantite: true,
            fournisseur: true,
          },
        },
        _count: { select: { tickets: true } },
      },
    });

    return raffles.map((raffle) => ({
      id: raffle.id,
      titre: raffle.titre,
      description: raffle.description,
      dateOuverture: raffle.dateOuverture,
      dateTirage: raffle.dateTirage,
      statut: raffle.statut,
      resultatPublieAt: raffle.resultatPublieAt,
      lots: raffle.lots,
      ticketsDistribues: raffle._count.tickets,
    }));
  }

  // --- Détail d'un tirage ---
  async detail(id: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: {
        lots: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            nom: true,
            valeurEstimee: true,
            quantite: true,
            fournisseur: true,
          },
        },
        _count: { select: { tickets: true } },
      },
    });
    if (!raffle) {
      throw new NotFoundException('Tirage introuvable.');
    }

    return {
      id: raffle.id,
      titre: raffle.titre,
      description: raffle.description,
      dateOuverture: raffle.dateOuverture,
      dateTirage: raffle.dateTirage,
      statut: raffle.statut,
      resultatPublieAt: raffle.resultatPublieAt,
      lots: raffle.lots,
      ticketsDistribues: raffle._count.tickets,
    };
  }

  // --- Résultat d'un tirage ---
  async resultat(id: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: {
        winners: {
          orderBy: { id: 'asc' },
          include: {
            lot: { select: { id: true, nom: true } },
            user: { select: { pseudo: true } },
          },
        },
      },
    });
    if (!raffle) {
      throw new NotFoundException('Tirage introuvable.');
    }
    // Tant que le tirage n'a pas eu lieu, il n'existe aucun résultat à
    // publier : la graine ne doit surtout pas fuiter avant.
    if (raffle.statut !== RaffleStatus.TIRE) {
      throw new NotFoundException(
        "Le résultat de ce tirage n'est pas encore publié.",
      );
    }

    return {
      id: raffle.id,
      titre: raffle.titre,
      statut: raffle.statut,
      dateTirage: raffle.dateTirage,
      resultatPublieAt: raffle.resultatPublieAt,
      graineAleatoire: raffle.graineAleatoire,
      gagnants: raffle.winners.map((winner) => ({
        lotId: winner.lot.id,
        lotNom: winner.lot.nom,
        ticketId: winner.ticketId,
        pseudo: winner.user.pseudo,
      })),
    };
  }
}
