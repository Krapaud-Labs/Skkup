import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MeService } from './me.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

// ─── Mise en place du module de test ─────────────────────────────────────────
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
    pointsTransaction: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    scratchCard: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  // Canal temps réel simulé : les notifications sont vérifiées à part
  // (voir realtime.gateway.spec.ts), ici on veut seulement isoler la
  // logique métier.
  let realtime: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn((args: { data: Record<string, unknown> }) => ({
          ...utilisateurDeBase,
          ...args.data,
        })),
      },
      pointsTransaction: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      scratchCard: {
        create: jest.fn((args: { data: Record<string, unknown> }) => ({
          id: 'carte-1',
          grattee: false,
          ...args.data,
        })),
      },
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
        MeService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeService, useValue: realtime },
      ],
    }).compile();

    service = module.get(MeService);
  });

  // ─── Profil ──────────────────────────────────────────────────────────────────
  it('retourne le profil sans exposer le passwordHash', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...utilisateurDeBase,
      pseudo: 'krapaud',
    });

    const profil = await service.profil('user-1');

    expect(profil).not.toHaveProperty('passwordHash');
    const [[appel]] = prisma.user.findUnique.mock.calls as Array<
      [{ where: { id: string }; select: Record<string, boolean> }]
    >;
    expect(appel.where).toEqual({ id: 'user-1' });
    expect(appel.select.passwordHash).toBeUndefined();
    expect(appel.select).toMatchObject({
      id: true,
      email: true,
      pseudo: true,
      soldePoints: true,
      streakActuel: true,
      streakMax: true,
    });
  });

  it("refuse le profil si l'utilisateur est introuvable", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.profil('user-1')).rejects.toThrow(NotFoundException);
  });

  // ─── Historique de points ────────────────────────────────────────────────────
  it("filtre l'historique sur l'utilisateur authentifié et pagine par défaut", async () => {
    prisma.pointsTransaction.findMany.mockResolvedValue([
      { id: 'tx-1', userId: 'user-1', montant: 5 },
    ]);
    prisma.pointsTransaction.count.mockResolvedValue(1);

    const resultat = await service.historiquePoints('user-1');

    expect(prisma.pointsTransaction.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(prisma.pointsTransaction.count).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(resultat).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(resultat.transactions).toHaveLength(1);
  });

  it("applique la page et la limite demandées sur l'historique", async () => {
    prisma.pointsTransaction.count.mockResolvedValue(25);

    const resultat = await service.historiquePoints('user-1', 3, 10);

    expect(prisma.pointsTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
    expect(resultat.totalPages).toBe(3);
  });

  it('plafonne la limite demandée', async () => {
    await service.historiquePoints('user-1', 1, 5000);

    expect(prisma.pointsTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it('retombe sur les valeurs par défaut pour une pagination invalide', async () => {
    await service.historiquePoints('user-1', 0, 0);

    expect(prisma.pointsTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  // ─── Visite quotidienne ──────────────────────────────────────────────────────
  it("refuse le check-in si l'utilisateur est introuvable", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.checkinQuotidien('user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('démarre un streak à 1 pour une première visite et débloque une carte (palier 1)', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...utilisateurDeBase });

    const resultat = await service.checkinQuotidien('user-1');

    expect(resultat.streakActuel).toBe(1);
    expect(resultat.pointsCredites).toBeGreaterThan(0);
    expect(prisma.pointsTransaction.create).toHaveBeenCalled();
    expect(prisma.scratchCard.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', streakPalier: 1 },
    });
    expect(resultat.carteDebloquee).not.toBeNull();
  });

  it('notifie points, streak et carte débloquée dans la room privée', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...utilisateurDeBase });

    await service.checkinQuotidien('user-1');

    expect(realtime.notifierPoints).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ type: 'VISITE_QUOTIDIENNE' }),
    );
    expect(realtime.notifierStreak).toHaveBeenCalledWith('user-1', {
      streakActuel: 1,
      streakMax: 1,
    });
    expect(realtime.notifierCarteDebloquee).toHaveBeenCalledWith('user-1', {
      carteId: 'carte-1',
      streakPalier: 1,
    });
  });

  it('ne débloque pas de carte hors palier (streak à 2)', async () => {
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    hier.setHours(12, 0, 0, 0);

    prisma.user.findUnique.mockResolvedValue({
      ...utilisateurDeBase,
      streakActuel: 1,
      streakMax: 1,
      derniereVisiteAt: hier,
    });

    const resultat = await service.checkinQuotidien('user-1');

    expect(resultat.streakActuel).toBe(2);
    expect(prisma.scratchCard.create).not.toHaveBeenCalled();
    expect(resultat.carteDebloquee).toBeNull();
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
