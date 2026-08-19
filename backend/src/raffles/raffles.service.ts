import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RaffleStatus } from '../../generated/prisma/enums';
import { ordreCanonique } from './tirage';
import { executerTirage } from './raffle-draw';
import type { CreateRaffleDto } from './dto/create-raffle.dto';

// Taille de page de la liste publique des participants. Elle est bornée
// pour qu'un tirage à fort volume ne transforme pas une requête GET de
// quelques octets en réponse de plusieurs mégaoctets (amplification).
const TAILLE_PAGE_PARTICIPANTS_PAR_DEFAUT = 500;
const TAILLE_PAGE_PARTICIPANTS_MAX = 2000;

// Ces endpoints sont publics (les tirages et leurs résultats sont
// affichés sur le site sans compte). On n'expose donc jamais d'identité
// technique : côté gagnants, seuls le pseudo et l'identifiant du ticket
// sortent, pas l'email ni l'identifiant utilisateur.
@Injectable()
export class RafflesService {
  constructor(private readonly prisma: PrismaService) {}

  async creer(dto: CreateRaffleDto) {
    const ouverture = new Date(dto.dateOuverture);
    const tirage = new Date(dto.dateTirage);
    if (tirage <= ouverture) {
      throw new BadRequestException(
        "La date du tirage doit être postérieure à l'ouverture.",
      );
    }
    if (dto.lots.length === 0) {
      throw new BadRequestException('Un tirage doit contenir au moins un lot.');
    }

    return this.prisma.raffle.create({
      data: {
        titre: dto.titre,
        description: dto.description,
        dateOuverture: ouverture,
        dateTirage: tirage,
        lots: {
          create: dto.lots.map((lot) => ({
            nom: lot.nom,
            valeurEstimee: lot.valeurEstimee,
            quantite: lot.quantite,
            fournisseur: lot.fournisseur,
          })),
        },
      },
      include: { lots: true },
    });
  }

  async tirer(id: string) {
    const resultat = await executerTirage(this.prisma, id);
    if (!resultat) {
      throw new ConflictException(
        'Le tirage est déjà clôturé, déjà effectué ou pas encore éligible.',
      );
    }
    return resultat;
  }

  // ─── Liste publique ────────────────────────────────────────────────────────
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

  // ─── Détail d'un tirage ────────────────────────────────────────────────────
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

  // ─── Résultat d'un tirage ──────────────────────────────────────────────────
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
      // Matériel d'audit : la graine ne suffit pas à rejouer le tirage,
      // il faut aussi la liste exacte des participants. On publie son
      // empreinte et son volume ici, la liste elle-même est paginée sur
      // `GET /raffles/:id/participants`.
      empreinteParticipants: raffle.empreinteParticipants,
      nombreParticipants: raffle.nombreParticipants,
      gagnants: raffle.winners.map((winner) => ({
        lotId: winner.lot.id,
        lotNom: winner.lot.nom,
        ticketId: winner.ticketId,
        pseudo: winner.user.pseudo,
      })),
    };
  }

  // ─── Liste des participants d'un tirage publié ─────────────────────────────
  /**
   * Liste ordonnée des identifiants de tickets ayant participé, dans
   * l'ordre canonique du moteur de tirage. C'est la pièce manquante d'un
   * audit indépendant : avec la graine, elle permet de rejouer la
   * sélection et de retrouver les mêmes gagnants.
   *
   * Publiée uniquement après le tirage, comme la graine : connaître à
   * l'avance la liste et son ordre aiderait un participant à optimiser sa
   * position si la graine venait à fuiter.
   */
  async participants(id: string, page = 0, taille?: number) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      select: {
        statut: true,
        empreinteParticipants: true,
        nombreParticipants: true,
      },
    });
    if (!raffle) {
      throw new NotFoundException('Tirage introuvable.');
    }
    if (raffle.statut !== RaffleStatus.TIRE) {
      throw new NotFoundException(
        "La liste des participants n'est publiée qu'après le tirage.",
      );
    }

    const tailleDemandee = taille ?? TAILLE_PAGE_PARTICIPANTS_PAR_DEFAUT;
    const taillePage = Math.min(
      Math.max(1, Math.trunc(tailleDemandee)),
      TAILLE_PAGE_PARTICIPANTS_MAX,
    );
    const pageDemandee = Math.max(0, Math.trunc(page));

    const tickets = await this.prisma.raffleTicket.findMany({
      where: { raffleId: id },
      select: { id: true },
      orderBy: { id: 'asc' },
      skip: pageDemandee * taillePage,
      take: taillePage,
    });

    return {
      id,
      empreinteParticipants: raffle.empreinteParticipants,
      nombreParticipants: raffle.nombreParticipants,
      page: pageDemandee,
      taillePage,
      // Aucune donnée personnelle : uniquement des identifiants de
      // tickets, jamais le pseudo ni l'identifiant du porteur.
      participants: ordreCanonique(tickets.map((ticket) => ticket.id)),
    };
  }
}
