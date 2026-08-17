import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WatchSessionsService } from './watch-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  Platform,
  WatchSessionSource,
  WatchSessionStatus,
} from '../../generated/prisma/enums';

// ─── Mise en place du module de test ─────────────────────────────────────────
describe('WatchSessionsService', () => {
  let service: WatchSessionsService;

  const sessionDeBase = {
    id: 'session-1',
    userId: 'user-1',
    platform: Platform.TWITCH,
    streamExternalId: 'stream-1',
    source: WatchSessionSource.EXTENSION,
    debutAt: new Date(),
    dernierHeartbeatAt: new Date(Date.now() - 30_000),
    dureeValideeSecondes: 0,
    statut: WatchSessionStatus.EN_COURS,
    dernierIntervalleSecondes: null as number | null,
    intervallesIdentiquesConsecutifs: 0,
  };

  let prisma: {
    stream: { findFirst: jest.Mock };
    watchSession: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findMany: jest.Mock;
    };
    pointsTransaction: { findMany: jest.Mock; create: jest.Mock };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };

  // Canal temps réel simulé : les notifications sont vérifiées à part
  // (voir realtime.gateway.spec.ts), ici on veut seulement isoler la
  // logique métier.
  let realtime: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      stream: { findFirst: jest.fn().mockResolvedValue({ id: 'stream-1' }) },
      watchSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...sessionDeBase }),
        update: jest.fn((args: { data: unknown }) => ({
          ...sessionDeBase,
          ...(args.data as Record<string, unknown>),
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      pointsTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      user: { update: jest.fn().mockResolvedValue({ soldePoints: 100 }) },
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
        WatchSessionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeService, useValue: realtime },
      ],
    }).compile();

    service = module.get(WatchSessionsService);
  });

  it('ouvre une session avec la source déduite du credential (lecteur embarqué)', async () => {
    prisma.watchSession.create = jest.fn().mockResolvedValue(sessionDeBase);
    await service.ouvrir(
      'user-1',
      { platform: Platform.TWITCH, streamExternalId: 'stream-1' },
      WatchSessionSource.LECTEUR_EMBARQUE,
    );
    expect(prisma.stream.findFirst).toHaveBeenCalledWith({
      where: {
        plateforme: Platform.TWITCH,
        identifiantChaine: 'stream-1',
        actif: true,
      },
      select: { id: true },
    });
    expect(prisma.watchSession.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        platform: Platform.TWITCH,
        streamExternalId: 'stream-1',
        source: WatchSessionSource.LECTEUR_EMBARQUE,
      },
    });
  });

  it('ouvre une session avec la source déduite du credential (extension)', async () => {
    prisma.watchSession.create = jest.fn().mockResolvedValue(sessionDeBase);
    await service.ouvrir(
      'user-1',
      { platform: Platform.TWITCH, streamExternalId: 'stream-1' },
      WatchSessionSource.EXTENSION,
    );
    expect(prisma.watchSession.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        platform: Platform.TWITCH,
        streamExternalId: 'stream-1',
        source: WatchSessionSource.EXTENSION,
      },
    });
  });

  it('refuse une session pour un stream absent du catalogue actif', async () => {
    prisma.stream.findFirst.mockResolvedValue(null);
    await expect(
      service.ouvrir(
        'user-1',
        { platform: Platform.TWITCH, streamExternalId: 'inconnu' },
        WatchSessionSource.LECTEUR_EMBARQUE,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // ─── Cas de test : contrôle d'accès et d'état ──────────────────────────────
  it('refuse le heartbeat si la session est introuvable', async () => {
    prisma.watchSession.findUnique.mockResolvedValue(null);

    await expect(
      service.heartbeat('user-1', 'session-1', {
        positionLectureSecondes: 30,
        enLecture: true,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("refuse le heartbeat si la session n'appartient pas à l'utilisateur", async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      userId: 'autre-utilisateur',
    });

    await expect(
      service.heartbeat('user-1', 'session-1', {
        positionLectureSecondes: 30,
        enLecture: true,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("refuse le heartbeat si la session n'est plus en cours", async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      statut: WatchSessionStatus.TERMINEE,
    });

    await expect(
      service.heartbeat('user-1', 'session-1', {
        positionLectureSecondes: 30,
        enLecture: true,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  // ─── Cas de test : cohérence temporelle et corrélation play/pause ──────────
  it('rejette un heartbeat envoyé alors que la lecture est en pause', async () => {
    prisma.watchSession.findUnique.mockResolvedValue({ ...sessionDeBase });

    await expect(
      service.heartbeat('user-1', 'session-1', {
        positionLectureSecondes: 30,
        enLecture: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un heartbeat avec un intervalle non plausible', async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      dernierHeartbeatAt: new Date(Date.now() - 10 * 60_000),
    });

    await expect(
      service.heartbeat('user-1', 'session-1', {
        positionLectureSecondes: 600,
        enLecture: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Cas de test : crédit de points et plafond quotidien ───────────────────
  it('crédite les points dus pour un heartbeat valide', async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      dureeValideeSecondes: 3600 * 4 - 30, // proche de 4h, +30s de heartbeat -> 4h
      dernierHeartbeatAt: new Date(Date.now() - 30_000),
    });

    const resultat = await service.heartbeat('user-1', 'session-1', {
      positionLectureSecondes: 3600,
      enLecture: true,
    });

    // Barème : 4h pleines = 40 pts + bonus palier 3h (5) = 45 pts.
    expect(resultat.pointsCredites).toBe(45);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { soldePoints: { increment: 45 } },
    });
  });

  it('ne crédite pas le lecteur embarqué sans attestation serveur', async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      source: WatchSessionSource.LECTEUR_EMBARQUE,
      dureeValideeSecondes: 3600 * 4 - 30,
      dernierHeartbeatAt: new Date(Date.now() - 30_000),
    });

    const resultat = await service.heartbeat('user-1', 'session-1', {
      positionLectureSecondes: 3600,
      enLecture: true,
    });

    expect(resultat.pointsCredites).toBe(0);
    expect(prisma.pointsTransaction.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("n'agrège que les sessions créditables dans le cumul du jour", async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      dureeValideeSecondes: 0,
      dernierHeartbeatAt: new Date(Date.now() - 30_000),
    });

    await service.heartbeat('user-1', 'session-1', {
      positionLectureSecondes: 30,
      enLecture: true,
    });

    // Le temps du lecteur embarqué ne doit pas pouvoir alimenter le
    // barème appliqué à une session d'extension : la requête d'agrégat
    // exclut les sources non créditables en base, pas après coup.
    const arguments_ = prisma.watchSession.findMany.mock.calls[0] as [
      { where: { source?: { in: WatchSessionSource[] } } },
    ];
    expect(arguments_[0].where.source).toEqual({
      in: [WatchSessionSource.EXTENSION],
    });
  });

  it("ne crédite pas une session d'extension avec le temps du lecteur embarqué", async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      dureeValideeSecondes: 0,
      dernierHeartbeatAt: new Date(Date.now() - 30_000),
    });
    // Aucune autre session créditable ce jour : les 6h accumulées par le
    // lecteur embarqué sont hors du périmètre de l'agrégat et ne
    // remontent donc pas ici.
    prisma.watchSession.findMany.mockResolvedValue([]);

    const resultat = await service.heartbeat('user-1', 'session-1', {
      positionLectureSecondes: 30,
      enLecture: true,
    });

    // 30 secondes validées : pas une heure pleine, donc zéro point.
    expect(resultat.pointsCredites).toBe(0);
    expect(prisma.pointsTransaction.create).not.toHaveBeenCalled();
  });

  it('ne crédite pas au-delà du plafond quotidien de 65 points', async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      dureeValideeSecondes: 3600 * 6 - 30, // proche du plafond de 6h
      dernierHeartbeatAt: new Date(Date.now() - 30_000),
    });
    prisma.pointsTransaction.findMany.mockResolvedValue([
      { montant: 65 }, // déjà crédité au maximum aujourd'hui
    ]);

    const resultat = await service.heartbeat('user-1', 'session-1', {
      positionLectureSecondes: 3600,
      enLecture: true,
    });

    expect(resultat.pointsCredites).toBe(0);
    expect(prisma.pointsTransaction.create).not.toHaveBeenCalled();
  });

  // ─── Cas de test : détection de heartbeats à intervalle identique ──────────
  it('invalide la session après plusieurs heartbeats à intervalle rigoureusement identique', async () => {
    const dernierHeartbeatAt = new Date(Date.now() - 30_000);
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      dernierIntervalleSecondes: 30,
      intervallesIdentiquesConsecutifs: 4,
      dernierHeartbeatAt,
    });

    await expect(
      service.heartbeat('user-1', 'session-1', {
        positionLectureSecondes: 30,
        enLecture: true,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.watchSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', dernierHeartbeatAt },
      data: { statut: WatchSessionStatus.INVALIDEE },
    });
  });

  // ─── Cas de test : concurrence (verrou optimiste) ──────────────────────────
  it('refuse le heartbeat si un heartbeat concurrent a déjà écrit la session (verrou optimiste)', async () => {
    prisma.watchSession.findUnique.mockResolvedValue({ ...sessionDeBase });
    prisma.watchSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.heartbeat('user-1', 'session-1', {
        positionLectureSecondes: 30,
        enLecture: true,
      }),
    ).rejects.toThrow(ConflictException);

    expect(prisma.pointsTransaction.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  // ─── Cas de test : fermeture de session ────────────────────────────────────
  it('ferme une session appartenant à l’utilisateur authentifié', async () => {
    prisma.watchSession.findUnique.mockResolvedValue({ ...sessionDeBase });

    await service.fermer('user-1', 'session-1');

    expect(prisma.watchSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { statut: WatchSessionStatus.TERMINEE },
    });
  });

  it("refuse de fermer une session d'un autre utilisateur", async () => {
    prisma.watchSession.findUnique.mockResolvedValue({
      ...sessionDeBase,
      userId: 'autre-utilisateur',
    });

    await expect(service.fermer('user-1', 'session-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
