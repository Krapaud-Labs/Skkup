import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import { RaffleStatus } from '../../generated/prisma/enums';
import { genererGraine, tirerGagnants } from './tirage';

// ---------------------------------------------------------------------
// Exécution du tirage
//
// Utilisable aussi bien depuis le worker BullMQ que depuis un futur
// endpoint d'administration : la logique ne dépend que d'un client
// Prisma et d'un point d'extension de notification.
// ---------------------------------------------------------------------

export interface ResultatTirage {
  raffleId: string;
  graineAleatoire: string;
  resultatPublieAt: Date;
  nombreTickets: number;
  gagnants: Array<{ lotId: string; ticketId: string; userId: string }>;
}

export interface OptionsTirage {
  /**
   * Point d'extension appelé après que le résultat a été committé en
   * base. La diffusion temps réel (`raffle:result`) viendra s'y brancher
   * sans toucher à la logique de tirage. Appelé hors transaction : une
   * notification qui échoue ne doit jamais annuler un tirage déjà écrit.
   */
  onTirageTermine?: (resultat: ResultatTirage) => void | Promise<void>;
  maintenant?: Date;
}

type ClientPrisma = Pick<PrismaClient, 'raffle' | '$transaction'>;

/**
 * Exécute le tirage d'un raffle donné.
 *
 * Renvoie `null` si le tirage n'était pas (ou plus) éligible : c'est le
 * verrou contre un double tirage. La clôture est faite par un
 * `updateMany` conditionnel sur le statut OUVERT, donc deux workers
 * concurrents ne peuvent pas tirer le même raffle deux fois.
 */
export async function executerTirage(
  prisma: ClientPrisma,
  raffleId: string,
  options: OptionsTirage = {},
): Promise<ResultatTirage | null> {
  const maintenant = options.maintenant ?? new Date();

  const resultat = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const cloture = await tx.raffle.updateMany({
        where: {
          id: raffleId,
          statut: RaffleStatus.OUVERT,
          dateTirage: { lte: maintenant },
        },
        data: { statut: RaffleStatus.CLOTURE },
      });
      // Déjà clôturé, déjà tiré, ou date non atteinte : on refuse par
      // défaut plutôt que de risquer un second tirage.
      if (cloture.count === 0) {
        return null;
      }

      const tickets = await tx.raffleTicket.findMany({
        where: { raffleId },
        select: { id: true, userId: true },
        orderBy: { id: 'asc' },
      });
      const lots = await tx.raffleLot.findMany({
        where: { raffleId },
        select: { id: true, quantite: true },
        orderBy: { id: 'asc' },
      });

      // La graine est produite puis journalisée avec le résultat : elle
      // permet à quiconque de rejouer la sélection a posteriori.
      const graineAleatoire = genererGraine();
      const gagnants = tirerGagnants(
        graineAleatoire,
        tickets.map((ticket) => ticket.id),
        lots,
      );

      const proprietaireParTicket = new Map(
        tickets.map((ticket) => [ticket.id, ticket.userId]),
      );
      const gagnantsAvecUtilisateur = gagnants.map((gagnant) => ({
        ...gagnant,
        userId: proprietaireParTicket.get(gagnant.ticketId) as string,
      }));

      if (gagnantsAvecUtilisateur.length > 0) {
        await tx.raffleWinner.createMany({
          data: gagnantsAvecUtilisateur.map((gagnant) => ({
            raffleId,
            lotId: gagnant.lotId,
            ticketId: gagnant.ticketId,
            userId: gagnant.userId,
          })),
        });
      }

      const resultatPublieAt = maintenant;
      await tx.raffle.update({
        where: { id: raffleId },
        data: {
          statut: RaffleStatus.TIRE,
          graineAleatoire,
          resultatPublieAt,
        },
      });

      return {
        raffleId,
        graineAleatoire,
        resultatPublieAt,
        nombreTickets: tickets.length,
        gagnants: gagnantsAvecUtilisateur,
      } satisfies ResultatTirage;
    },
  );

  if (resultat && options.onTirageTermine) {
    await options.onTirageTermine(resultat);
  }

  return resultat;
}

/**
 * Tire tous les raffles ouverts dont la date de tirage est dépassée.
 * C'est le point d'entrée du job planifié.
 */
export async function executerTiragesDus(
  prisma: ClientPrisma,
  options: OptionsTirage = {},
): Promise<ResultatTirage[]> {
  const maintenant = options.maintenant ?? new Date();

  const aTirer = await prisma.raffle.findMany({
    where: { statut: RaffleStatus.OUVERT, dateTirage: { lte: maintenant } },
    select: { id: true },
    orderBy: { dateTirage: 'asc' },
  });

  const resultats: ResultatTirage[] = [];
  for (const raffle of aTirer) {
    const resultat = await executerTirage(prisma, raffle.id, {
      ...options,
      maintenant,
    });
    if (resultat) {
      resultats.push(resultat);
    }
  }
  return resultats;
}
