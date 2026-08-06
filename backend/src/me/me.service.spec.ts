import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MeService } from './me.service';
import { PrismaService } from '../prisma/prisma.service';

// --- Mise en place du module de test ---
describe('MeService', () => {
  let service: MeService;

  const utilisateurDeBase = {
    id: 'user-1',
    email: 'test@example.com',
    streakActuel: 0,
    streakMax: 0,
    derniereVisiteAt: null as Date | null,
    soldePoints: 0,
  };

  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    pointsTransaction: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn((args: { data: Record<string, unknown> }) => ({
          ...utilisateurDeBase,
          ...args.data,
        })),
      },
      pointsTransaction: { create: jest.fn() },
      $transaction: jest.fn((cb: (tx: typeof prisma) => unknown) => cb(prisma)),
    };

    const module = await Test.createTestingModule({
      providers: [MeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(MeService);
  });

  it("refuse le check-in si l'utilisateur est introuvable", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.checkinQuotidien('user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('démarre un streak à 1 pour une première visite', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...utilisateurDeBase });

    const resultat = await service.checkinQuotidien('user-1');

    expect(resultat.streakActuel).toBe(1);
    expect(resultat.pointsCredites).toBeGreaterThan(0);
    expect(prisma.pointsTransaction.create).toHaveBeenCalled();
  });

  it('incrémente le streak pour une visite consécutive (hier)', async () => {
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    hier.setHours(12, 0, 0, 0);

    prisma.user.findUnique.mockResolvedValue({
      ...utilisateurDeBase,
      streakActuel: 4,
      streakMax: 4,
      derniereVisiteAt: hier,
    });

    const resultat = await service.checkinQuotidien('user-1');

    expect(resultat.streakActuel).toBe(5);
    expect(resultat.streakMax).toBe(5);
  });

  it('remet le streak à 1 si un jour a été manqué', async () => {
    const avantHier = new Date();
    avantHier.setDate(avantHier.getDate() - 2);
    avantHier.setHours(12, 0, 0, 0);

    prisma.user.findUnique.mockResolvedValue({
      ...utilisateurDeBase,
      streakActuel: 10,
      streakMax: 10,
      derniereVisiteAt: avantHier,
    });

    const resultat = await service.checkinQuotidien('user-1');

    expect(resultat.streakActuel).toBe(1);
    expect(resultat.streakMax).toBe(10);
  });

  it('refuse un second check-in le même jour', async () => {
    const ceMatin = new Date();
    ceMatin.setHours(6, 0, 0, 0);

    prisma.user.findUnique.mockResolvedValue({
      ...utilisateurDeBase,
      streakActuel: 2,
      derniereVisiteAt: ceMatin,
    });

    await expect(service.checkinQuotidien('user-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.pointsTransaction.create).not.toHaveBeenCalled();
  });
});
