import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { SessionRevocationService } from '../src/auth/session-revocation.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { jourConnexion } from '../src/auth/cookie-session';
import { PostAuthThrottlerGuard } from '../src/common/throttler.guards';
import { ExtensionAuthGuard } from '../src/extension/extension-auth.guard';
import { ExtensionController } from '../src/extension/extension.controller';
import { ExtensionService } from '../src/extension/extension.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeService } from '../src/realtime/realtime.service';
import { WatchSessionCredentialGuard } from '../src/watch-sessions/watch-session-credential.guard';
import { WatchSessionsController } from '../src/watch-sessions/watch-sessions.controller';
import { WatchSessionsService } from '../src/watch-sessions/watch-sessions.service';
import {
  empreinteJeton,
  normaliserCodeAppariement,
} from '../src/extension/jetons-extension';

const JWT_SECRET = 'isolated-watch-session-heartbeat-e2e-only-secret';
const PREVIOUS_VALIDATED_SECONDS = 3_570;
const HEARTBEAT_INTERVAL_SECONDS = 30;

interface PairingTokenResponse {
  code: string;
}

interface PairResponse {
  jetonExtension: string;
}

interface OpenSessionResponse {
  id: string;
  userId: string;
  platform: string;
  streamExternalId: string;
  source: string;
  statut: string;
  dureeValideeSecondes: number;
}

interface HeartbeatResponse {
  session: OpenSessionResponse;
  pointsCredites: number;
}

function assertSafeE2eDatabase(databaseUrl: string | undefined): void {
  if (process.env.WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE !== '1') {
    throw new Error(
      'Set WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE=1 only for an isolated test database.',
    );
  }
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for this E2E test.');
  }

  const url = new URL(databaseUrl);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const safeName = /(?:^|[_-])(?:test|qa)(?:[_-]|$)/i.test(databaseName);
  const safeHost = ['localhost', '127.0.0.1', '::1', 'postgres'].includes(
    url.hostname.toLowerCase(),
  );
  if (!safeName || !safeHost) {
    throw new Error(
      `Refusing watch session heartbeat E2E against ${url.hostname}/${databaseName}; use a local database named *_test or *_qa.`,
    );
  }
}

describe('watch session heartbeat (HTTP + PostgreSQL integration)', () => {
  const runId = randomUUID();
  const viewerUserId = `watch-heartbeat-viewer-${runId}`;
  const otherUserId = `watch-heartbeat-other-${runId}`;
  const viewerEmail = `watch-heartbeat-${runId}@example.test`;
  const otherEmail = `watch-heartbeat-other-${runId}@example.test`;
  const viewerPseudo = `watch-hb-${runId.slice(0, 10)}`;
  const otherPseudo = `watch-hb-other-${runId.slice(0, 8)}`;
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeAll(async () => {
    assertSafeE2eDatabase(process.env.DATABASE_URL);
    process.env.JWT_SECRET = JWT_SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [
        PrismaModule,
        PassportModule,
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
        ThrottlerModule.forRoot([
          { name: 'preauth', ttl: 60_000, limit: 120 },
          { name: 'default', ttl: 60_000, limit: 120 },
        ]),
      ],
      controllers: [ExtensionController, WatchSessionsController],
      providers: [
        ExtensionService,
        WatchSessionsService,
        JwtAuthGuard,
        JwtStrategy,
        ExtensionAuthGuard,
        WatchSessionCredentialGuard,
        PostAuthThrottlerGuard,
        SessionRevocationService,
        {
          provide: RealtimeService,
          useValue: {
            notifierAppariements: jest.fn(),
            notifierPoints: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);

    await prisma.user.createMany({
      data: [
        {
          id: viewerUserId,
          email: viewerEmail,
          passwordHash: 'unused synthetic E2E credential',
          pseudo: viewerPseudo,
          role: 'VIEWER',
        },
        {
          id: otherUserId,
          email: otherEmail,
          passwordHash: 'unused synthetic E2E credential',
          pseudo: otherPseudo,
          role: 'VIEWER',
        },
      ],
    });
  }, 30_000);

  afterAll(async () => {
    const userIds = [viewerUserId, otherUserId];
    try {
      if (prisma) {
        await prisma.pointsTransaction.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.watchSession.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.extensionPairingToken.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.extensionPairing.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } finally {
      await app?.close();
    }
  });

  async function bearerFor(userId: string, email: string): Promise<string> {
    return jwt.signAsync({
      sub: userId,
      email,
      sessionVersion: 0,
      jourConnexion: jourConnexion(),
    });
  }

  async function issueExtensionCredential(
    userId: string,
    email: string,
  ): Promise<string> {
    const http = request(app.getHttpServer());
    const viewerBearer = await bearerFor(userId, email);
    const tokenResponse = await http
      .post('/extension/pairing-token')
      .set('Authorization', `Bearer ${viewerBearer}`)
      .expect(201);
    const pairingToken = tokenResponse.body as PairingTokenResponse;
    const normalizedCode = normaliserCodeAppariement(pairingToken.code);
    if (!normalizedCode) {
      throw new Error('Pairing endpoint returned an invalid code.');
    }

    const pairResponse = await http
      .post('/extension/pair')
      .send({ code: pairingToken.code })
      .expect(200);
    const credential = (pairResponse.body as PairResponse).jetonExtension;
    const storedCredential = await prisma.extensionPairing.findUniqueOrThrow({
      where: { tokenHash: empreinteJeton(credential) },
      select: { userId: true, tokenHash: true },
    });
    expect(storedCredential.userId).toBe(userId);
    expect(storedCredential.tokenHash).not.toBe(credential);
    return credential;
  }

  it('authenticates the extension credential, derives source server-side and persists a valid heartbeat credit', async () => {
    const http = request(app.getHttpServer());
    await http
      .post('/watch-sessions')
      .send({ platform: 'TWITCH', streamExternalId: 'synthetic-stream' })
      .expect(401);

    const extensionCredential = await issueExtensionCredential(
      viewerUserId,
      viewerEmail,
    );
    const secondCredential = await issueExtensionCredential(
      otherUserId,
      otherEmail,
    );

    const openingPayload = {
      platform: 'TWITCH',
      streamExternalId: `synthetic-stream-${runId}`,
    };
    await http
      .post('/watch-sessions')
      .set('Authorization', `Bearer ${extensionCredential}`)
      .send({ ...openingPayload, source: 'LECTEUR_EMBARQUE' })
      .expect(400);

    const openedResponse = await http
      .post('/watch-sessions')
      .set('Authorization', `Bearer ${extensionCredential}`)
      .send(openingPayload)
      .expect(201);
    const opened = openedResponse.body as OpenSessionResponse;
    expect(opened.userId).toBe(viewerUserId);
    expect(opened.source).toBe('EXTENSION');
    expect(opened.statut).toBe('EN_COURS');

    const openedRecord = await prisma.watchSession.findUniqueOrThrow({
      where: { id: opened.id },
    });
    expect(openedRecord.source).toBe('EXTENSION');
    expect(openedRecord.userId).toBe(viewerUserId);

    await prisma.watchSession.update({
      where: { id: opened.id },
      data: {
        dureeValideeSecondes: PREVIOUS_VALIDATED_SECONDS,
        dernierHeartbeatAt: new Date(
          Date.now() - HEARTBEAT_INTERVAL_SECONDS * 1000,
        ),
      },
    });

    await http
      .post(`/watch-sessions/${opened.id}/heartbeat`)
      .set('Authorization', `Bearer ${secondCredential}`)
      .send({ positionLectureSecondes: 3600, enLecture: true })
      .expect(403);
    const ownerSessionAfterRefusal =
      await prisma.watchSession.findUniqueOrThrow({
        where: { id: opened.id },
      });
    expect(ownerSessionAfterRefusal.dureeValideeSecondes).toBe(
      PREVIOUS_VALIDATED_SECONDS,
    );

    const heartbeatResponse = await http
      .post(`/watch-sessions/${opened.id}/heartbeat`)
      .set('Authorization', `Bearer ${extensionCredential}`)
      .send({ positionLectureSecondes: 3600, enLecture: true })
      .expect(201);
    const heartbeat = heartbeatResponse.body as HeartbeatResponse;
    expect(heartbeat.session.id).toBe(opened.id);
    expect(heartbeat.session.source).toBe('EXTENSION');
    expect(heartbeat.session.dureeValideeSecondes).toBeGreaterThan(
      PREVIOUS_VALIDATED_SECONDS,
    );
    expect(heartbeat.pointsCredites).toBeGreaterThan(0);

    const [persistedSession, user, transactions] = await Promise.all([
      prisma.watchSession.findUniqueOrThrow({ where: { id: opened.id } }),
      prisma.user.findUniqueOrThrow({
        where: { id: viewerUserId },
        select: { soldePoints: true },
      }),
      prisma.pointsTransaction.findMany({
        where: { userId: viewerUserId, watchSessionId: opened.id },
        select: { type: true, montant: true, watchSessionId: true },
      }),
    ]);
    expect(persistedSession.source).toBe('EXTENSION');
    expect(persistedSession.dureeValideeSecondes).toBe(
      heartbeat.session.dureeValideeSecondes,
    );
    expect(transactions).toEqual([
      expect.objectContaining({
        type: 'WATCH_TIME',
        montant: heartbeat.pointsCredites,
        watchSessionId: opened.id,
      }),
    ]);
    const ledgerTotal = await prisma.pointsTransaction.aggregate({
      where: { userId: viewerUserId },
      _sum: { montant: true },
    });
    expect(user.soldePoints).toBe(ledgerTotal._sum.montant ?? 0);
    expect(user.soldePoints).toBe(heartbeat.pointsCredites);
  }, 30_000);

  it('persists the 65-point daily ceiling and credits nothing beyond it', async () => {
    const extensionCredential = await issueExtensionCredential(
      viewerUserId,
      viewerEmail,
    );
    const http = request(app.getHttpServer());

    // Exercise the daily cap with real PostgreSQL rows: 64 points already
    // credited, then a valid heartbeat reaches the 65-point maximum.
    await prisma.pointsTransaction.deleteMany({
      where: { userId: viewerUserId },
    });
    await prisma.user.update({
      where: { id: viewerUserId },
      data: { soldePoints: 64 },
    });
    await prisma.pointsTransaction.create({
      data: {
        userId: viewerUserId,
        type: 'WATCH_TIME',
        montant: 64,
      },
    });

    const capSessionResponse = await http
      .post('/watch-sessions')
      .set('Authorization', `Bearer ${extensionCredential}`)
      .send({
        platform: 'TWITCH',
        streamExternalId: `synthetic-cap-${runId}`,
      })
      .expect(201);
    const capSession = capSessionResponse.body as OpenSessionResponse;
    await prisma.watchSession.update({
      where: { id: capSession.id },
      data: {
        dureeValideeSecondes: 6 * 3600 - 5,
        dernierHeartbeatAt: new Date(Date.now() - 30_000),
      },
    });

    const requestPayload = {
      positionLectureSecondes: 6 * 3600,
      enLecture: true,
    };
    const capHeartbeatResponse = await http
      .post(`/watch-sessions/${capSession.id}/heartbeat`)
      .set('Authorization', `Bearer ${extensionCredential}`)
      .send(requestPayload)
      .expect(201);
    const capHeartbeat = capHeartbeatResponse.body as HeartbeatResponse;
    expect(capHeartbeat.pointsCredites).toBe(1);

    const [transactionsAtCap, userAtCap] = await Promise.all([
      prisma.pointsTransaction.findMany({
        where: { userId: viewerUserId, type: 'WATCH_TIME' },
        select: { montant: true },
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: viewerUserId },
        select: { soldePoints: true },
      }),
    ]);
    const pointsAtCap = transactionsAtCap.reduce(
      (total, transaction) => total + transaction.montant,
      0,
    );
    expect(pointsAtCap).toBe(65);
    expect(userAtCap.soldePoints).toBe(65);

    // Seed another valid elapsed interval after the cap. This assertion
    // checks that the capped milestone is not credited twice and that no
    // further points are issued after the daily ceiling; it does not claim
    // strict idempotency for the heartbeat request itself.
    await prisma.watchSession.update({
      where: { id: capSession.id },
      data: {
        dureeValideeSecondes: capHeartbeat.session.dureeValideeSecondes,
        dernierHeartbeatAt: new Date(Date.now() - 30_000),
      },
    });
    const afterCapResponse = await http
      .post(`/watch-sessions/${capSession.id}/heartbeat`)
      .set('Authorization', `Bearer ${extensionCredential}`)
      .send(requestPayload)
      .expect(201);
    expect((afterCapResponse.body as HeartbeatResponse).pointsCredites).toBe(0);

    const debutJournee = new Date();
    debutJournee.setHours(0, 0, 0, 0);
    const [transactionsAfterCap, linkedTransactionsAfterCap, userAfterCap] =
      await Promise.all([
        prisma.pointsTransaction.findMany({
          where: {
            userId: viewerUserId,
            type: 'WATCH_TIME',
            createdAt: { gte: debutJournee },
          },
          select: { montant: true },
        }),
        prisma.pointsTransaction.findMany({
          where: { userId: viewerUserId, watchSessionId: capSession.id },
          select: { montant: true },
        }),
        prisma.user.findUniqueOrThrow({
          where: { id: viewerUserId },
          select: { soldePoints: true },
        }),
      ]);
    const pointsAfterCap = transactionsAfterCap.reduce(
      (total, transaction) => total + transaction.montant,
      0,
    );
    expect(transactionsAfterCap).toHaveLength(transactionsAtCap.length);
    expect(linkedTransactionsAfterCap).toHaveLength(1);
    expect(pointsAfterCap).toBe(65);
    expect(userAfterCap.soldePoints).toBe(65);
  }, 30_000);
});
