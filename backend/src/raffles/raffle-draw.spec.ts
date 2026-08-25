import type { ResultatTirage } from './raffle-draw';
import { executerTirage, executerTiragesDus } from './raffle-draw';
import { RaffleStatus } from '../../generated/prisma/enums';
import { calculerEmpreinteParticipants, tirerGagnants } from './tirage';

// ─── Double de test prisma ───────────────────────────────────────────────────
type PrismaSimule = {
  raffle: {
    findMany: jest.Mock;
    updateMany: jest.Mock;
    update: jest.Mock;
  };
  raffleTicket: { findMany: jest.Mock };
  raffleLot: { findMany: jest.Mock };
  raffleWinner: { createMany: jest.Mock };
  $transaction: jest.Mock;
};

function creerPrisma(options?: {
  tickets?: Array<{ id: string; userId: string }>;
  lots?: Array<{ id: string; quantite: number }>;
  clotureEffective?: boolean;
}): PrismaSimule {
  const tickets = options?.tickets ?? [
    { id: 'ticket-1', userId: 'user-1' },
    { id: 'ticket-2', userId: 'user-2' },
    { id: 'ticket-3', userId: 'user-3' },
    { id: 'ticket-4', userId: 'user-4' },
  ];
  const lots = options?.lots ?? [
    { id: 'lot-a', quantite: 1 },
    { id: 'lot-b', quantite: 2 },
  ];

  const prisma: PrismaSimule = {
    raffle: {
      findMany: jest.fn().mockResolvedValue([{ id: 'raffle-1' }]),
      updateMany: jest.fn().mockResolvedValue({
        count: options?.clotureEffective === false ? 0 : 1,
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    raffleTicket: { findMany: jest.fn().mockResolvedValue(tickets) },
    raffleLot: { findMany: jest.fn().mockResolvedValue(lots) },
    raffleWinner: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    (callback: (tx: PrismaSimule) => unknown) => callback(prisma),
  );
  return prisma;
}

// Le module attend un client Prisma réel ; le double couvre la surface
// utilisée.
const commeClient = (prisma: PrismaSimule) => prisma as never;

describe('executerTirage', () => {
  it('clôture, tire et publie le résultat dans une seule transaction', async () => {
    const prisma = creerPrisma();
    const maintenant = new Date('2026-08-12T10:00:00.000Z');

    const resultat = await executerTirage(commeClient(prisma), 'raffle-1', {
      maintenant,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(resultat).not.toBeNull();
    expect(resultat!.nombreTickets).toBe(4);
    expect(resultat!.gagnants).toHaveLength(3);
    expect(resultat!.graineAleatoire).toMatch(/^[0-9a-f]{64}$/);
    expect(prisma.raffle.update).toHaveBeenCalledWith({
      where: { id: 'raffle-1' },
      data: {
        statut: RaffleStatus.TIRE,
        graineAleatoire: resultat!.graineAleatoire,
        empreinteParticipants: resultat!.empreinteParticipants,
        nombreParticipants: 4,
        resultatPublieAt: maintenant,
      },
    });
  });

  it("fige et publie l'empreinte de la liste des participants", async () => {
    const prisma = creerPrisma();

    const resultat = await executerTirage(commeClient(prisma), 'raffle-1');

    expect(resultat!.empreinteParticipants).toBe(
      calculerEmpreinteParticipants([
        'ticket-1',
        'ticket-2',
        'ticket-3',
        'ticket-4',
      ]),
    );
  });

  it("détecte l'ajout d'un ticket après publication du résultat", async () => {
    const prisma = creerPrisma();

    const resultat = await executerTirage(commeClient(prisma), 'raffle-1');

    // Un ticket glissé après coup ne peut pas passer inaperçu : la liste
    // publiée ne redonne plus l'empreinte figée au moment du tirage.
    const empreinteApresAjout = calculerEmpreinteParticipants([
      'ticket-1',
      'ticket-2',
      'ticket-3',
      'ticket-4',
      'ticket-5',
    ]);
    expect(empreinteApresAjout).not.toBe(resultat!.empreinteParticipants);
  });

  it('ne clôture que les tirages ouverts dont la date est dépassée', async () => {
    const prisma = creerPrisma();
    const maintenant = new Date('2026-08-12T10:00:00.000Z');

    await executerTirage(commeClient(prisma), 'raffle-1', { maintenant });

    expect(prisma.raffle.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'raffle-1',
        statut: RaffleStatus.OUVERT,
        dateTirage: { lte: maintenant },
      },
      data: { statut: RaffleStatus.CLOTURE },
    });
  });

  it('refuse de tirer un raffle déjà clôturé (protection double tirage)', async () => {
    const prisma = creerPrisma({ clotureEffective: false });

    const resultat = await executerTirage(commeClient(prisma), 'raffle-1');

    expect(resultat).toBeNull();
    expect(prisma.raffleWinner.createMany).not.toHaveBeenCalled();
    expect(prisma.raffle.update).not.toHaveBeenCalled();
  });

  it('associe chaque gagnant au propriétaire de son ticket, une seule fois', async () => {
    const prisma = creerPrisma();

    const resultat = await executerTirage(commeClient(prisma), 'raffle-1');

    const ticketIds = resultat!.gagnants.map((gagnant) => gagnant.ticketId);
    expect(new Set(ticketIds).size).toBe(ticketIds.length);
    for (const gagnant of resultat!.gagnants) {
      expect(gagnant.userId).toBe(gagnant.ticketId.replace('ticket', 'user'));
    }
  });

  it('reste rejouable : graine et liste publiées redonnent les mêmes gagnants', async () => {
    const prisma = creerPrisma();

    const resultat = await executerTirage(commeClient(prisma), 'raffle-1');

    // Reproduction d'un audit externe : on part uniquement du matériel
    // publié (graine + liste des participants vérifiée par l'empreinte).
    const participantsPublies = [
      'ticket-1',
      'ticket-2',
      'ticket-3',
      'ticket-4',
    ];
    expect(calculerEmpreinteParticipants(participantsPublies)).toBe(
      resultat!.empreinteParticipants,
    );
    const rejoue = tirerGagnants(
      resultat!.graineAleatoire,
      participantsPublies,
      [
        { id: 'lot-a', quantite: 1 },
        { id: 'lot-b', quantite: 2 },
      ],
    );
    expect(rejoue).toEqual(
      resultat!.gagnants.map(({ lotId, ticketId }) => ({ lotId, ticketId })),
    );
  });

  it("publie un tirage sans gagnant quand aucun ticket n'a été distribué", async () => {
    const prisma = creerPrisma({ tickets: [] });

    const resultat = await executerTirage(commeClient(prisma), 'raffle-1');

    expect(resultat!.gagnants).toEqual([]);
    expect(prisma.raffleWinner.createMany).not.toHaveBeenCalled();
    expect(prisma.raffle.update).toHaveBeenCalled();
  });

  it("notifie le point d'extension après écriture du résultat", async () => {
    const prisma = creerPrisma();
    const onTirageTermine = jest.fn<void, [ResultatTirage]>();

    await executerTirage(commeClient(prisma), 'raffle-1', { onTirageTermine });

    expect(onTirageTermine).toHaveBeenCalledTimes(1);
    expect(onTirageTermine.mock.calls[0][0]).toMatchObject({
      raffleId: 'raffle-1',
    });
  });
});

describe('executerTiragesDus', () => {
  it('exécute tous les tirages ouverts dont la date est passée', async () => {
    const prisma = creerPrisma();
    const maintenant = new Date('2026-08-25T09:00:00.000Z');
    prisma.raffle.findMany.mockResolvedValue([
      { id: 'raffle-1' },
      { id: 'raffle-2' },
    ]);

    const resultats = await executerTiragesDus(commeClient(prisma), {
      maintenant,
    });

    expect(resultats).toHaveLength(2);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(prisma.raffle.findMany).toHaveBeenCalledWith({
      where: {
        statut: RaffleStatus.OUVERT,
        dateTirage: { lte: maintenant },
        engagementGraine: null,
      },
      select: { id: true },
      orderBy: { dateTirage: 'asc' },
    });
  });

  it("ne fait rien quand aucun tirage n'est dû", async () => {
    const prisma = creerPrisma();
    prisma.raffle.findMany.mockResolvedValue([]);

    expect(await executerTiragesDus(commeClient(prisma))).toEqual([]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
