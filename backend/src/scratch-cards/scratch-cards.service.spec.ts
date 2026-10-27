import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ScratchCardsService } from './scratch-cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RaffleStatus } from '../../generated/prisma/enums';
import { randomInt } from 'node:crypto';

jest.mock('node:crypto', () => ({ randomInt: jest.fn() }));

const randomIntSimule = randomInt as unknown as jest.MockedFunction<
  (max: number) => number
>;

// ─── Mise en place du module de test ─────────────────────────────────────────
describe('ScratchCardsService', () => {
  let service: ScratchCardsService;

  const carteDeBase = {
    id: 'carte-1',
    userId: 'user-1',
    streakPalier: 1,
    grattee: false,
    gainType: null as string | null,
    gainMontant: null as number | null,
    gainPrepareAt: null as Date | null,
    createdAt: new Date(),
    gratteeAt: null as Date | null,
  };

  let prisma: {
    scratchCard: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      updateMany: jest.Mock;
    };
    pointsTransaction: { create: jest.Mock };
    user: { update: jest.Mock };
    raffle: { findFirst: jest.Mock };
    raffleTicket: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  // Canal temps réel simulé : les notifications sont vérifiées à part
  // (voir realtime.gateway.spec.ts), ici on veut seulement isoler la
  // logique métier.
  let realtime: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      scratchCard: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...carteDeBase }),
        updateMany: jest
          .fn()
          .mockImplementation(
            (args: {
              where: Record<string, unknown>;
              data: Record<string, unknown>;
            }) => {
              if ('gainPrepareAt' in args.where) {
                prisma.scratchCard.findUnique.mockResolvedValue({
                  ...carteDeBase,
                  ...args.data,
                });
              }
              return Promise.resolve({ count: 1 });
            },
          ),
      },
      pointsTransaction: { create: jest.fn() },
      user: { update: jest.fn().mockResolvedValue({ soldePoints: 100 }) },
      raffle: { findFirst: jest.fn().mockResolvedValue(null) },
      raffleTicket: { create: jest.fn() },
      $transaction: jest.fn((cb: (tx: typeof prisma) => unknown) => cb(prisma)),
    };

    realtime = {
      notifierPoints: jest.fn(),
      notifierStreak: jest.fn(),
      notifierCarteDebloquee: jest.fn(),
      notifierStatutTirage: jest.fn(),
      notifierResultatTirage: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ScratchCardsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeService, useValue: realtime },
      ],
    }).compile();

    service = module.get(ScratchCardsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── Cas de test : contrôle d'accès ────────────────────────────────────────
  it('refuse de gratter une carte introuvable', async () => {
    prisma.scratchCard.findUnique.mockResolvedValue(null);

    await expect(service.gratter('user-1', 'carte-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it("refuse de gratter une carte d'un autre utilisateur", async () => {
    prisma.scratchCard.findUnique.mockResolvedValue({
      ...carteDeBase,
      userId: 'autre-utilisateur',
    });

    await expect(service.gratter('user-1', 'carte-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refuse de gratter une carte déjà grattée', async () => {
    prisma.scratchCard.findUnique.mockResolvedValue({
      ...carteDeBase,
      grattee: true,
    });

    await expect(service.gratter('user-1', 'carte-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('refuse le grattage concurrent détecté par le verrou optimiste', async () => {
    prisma.scratchCard.findUnique.mockResolvedValue({ ...carteDeBase });
    prisma.scratchCard.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.gratter('user-1', 'carte-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.pointsTransaction.create).not.toHaveBeenCalled();
  });

  // ─── Cas de test : répartition des gains (CSPRNG simulé) ──────────────────
  it('crédite des points quand le tirage tombe sur "points"', async () => {
    prisma.scratchCard.findUnique.mockResolvedValue({ ...carteDeBase });
    randomIntSimule.mockReturnValue(10); // < 70 -> points

    await service.gratter('user-1', 'carte-1');

    expect(prisma.pointsTransaction.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.raffleTicket.create).not.toHaveBeenCalled();
  });

  it('ne crédite rien quand le tirage tombe sur "rien"', async () => {
    prisma.scratchCard.findUnique.mockResolvedValue({ ...carteDeBase });
    randomIntSimule.mockReturnValue(80); // entre 70 et 94 -> rien

    await service.gratter('user-1', 'carte-1');

    expect(prisma.pointsTransaction.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('crée un ticket de tirage quand un tirage est ouvert et que le gain est "ticket"', async () => {
    prisma.scratchCard.findUnique.mockResolvedValue({ ...carteDeBase });
    prisma.raffle.findFirst.mockResolvedValue({
      id: 'raffle-1',
      statut: RaffleStatus.OUVERT,
    });
    randomIntSimule.mockReturnValue(99); // >= 95 -> ticket

    const resultat = await service.gratter('user-1', 'carte-1');

    expect(prisma.raffleTicket.create).toHaveBeenCalledWith({
      data: { raffleId: 'raffle-1', userId: 'user-1' },
    });
    expect(resultat.ticketCree).toBe(true);
    expect(prisma.pointsTransaction.create).not.toHaveBeenCalled();
  });

  it('retombe sur des points si le gain est "ticket" mais aucun tirage ouvert', async () => {
    prisma.scratchCard.findUnique.mockResolvedValue({ ...carteDeBase });
    prisma.raffle.findFirst.mockResolvedValue(null);
    randomIntSimule.mockReturnValue(99);

    const resultat = await service.gratter('user-1', 'carte-1');

    expect(prisma.raffleTicket.create).not.toHaveBeenCalled();
    expect(resultat.ticketCree).toBe(false);
    expect(prisma.pointsTransaction.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  // ─── Cas de test : liste des cartes disponibles ────────────────────────────
  it('liste uniquement les cartes non grattées', async () => {
    await service.lister('user-1');

    expect(prisma.scratchCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', grattee: false },
      }),
    );
  });
});
