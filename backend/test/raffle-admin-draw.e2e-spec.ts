import { createHash, randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AdminGuard } from '../src/auth/guards/admin.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { ViewerGuard } from '../src/auth/guards/viewer.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { jourConnexion } from '../src/auth/cookie-session';
import { PostAuthThrottlerGuard } from '../src/common/throttler.guards';
import { MeController } from '../src/me/me.controller';
import { MeService } from '../src/me/me.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeService } from '../src/realtime/realtime.service';
import { AdminRafflesController } from '../src/raffles/admin-raffles.controller';
import { RafflesController } from '../src/raffles/raffles.controller';
import { RafflesService } from '../src/raffles/raffles.service';
import { executerTiragesDus } from '../src/raffles/raffle-draw';
import {
  calculerEmpreinteParticipants,
  ordreCanonique,
  tirerGagnants,
} from '../src/raffles/tirage';

const JWT_SECRET = 'isolated-raffle-admin-draw-e2e-only-secret';

interface DrawResponse {
  raffleId: string;
  graineAleatoire: string;
  empreinteParticipants: string;
  resultatPublieAt: string;
  nombreTickets: number;
  gagnants: Array<{ lotId: string; ticketId: string; userId: string }>;
}

interface PublishedResult {
  id: string;
  statut: string;
  graineAleatoire: string;
  empreinteParticipants: string;
  nombreParticipants: number;
  gagnants: Array<{
    lotId: string;
    lotNom: string;
    ticketId: string;
    pseudo: string;
  }>;
}

interface PublishedParticipants {
  id: string;
  empreinteParticipants: string;
  nombreParticipants: number;
  participants: string[];
}

function assertSafeE2eDatabase(databaseUrl: string | undefined): void {
  if (process.env.RAFFLE_DRAW_E2E_ALLOW_DATABASE !== '1') {
    throw new Error(
      'Set RAFFLE_DRAW_E2E_ALLOW_DATABASE=1 only for an isolated test database.',
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
      `Refusing raffle admin draw E2E against ${url.hostname}/${databaseName}; use a local database named *_test or *_qa.`,
    );
  }
}

describe('admin raffle draw (HTTP + PostgreSQL integration)', () => {
  const runId = randomUUID();
  const adminUserId = `raffle-admin-e2e-${runId}`;
  const viewerUserId = `raffle-viewer-e2e-${runId}`;
  const participantAId = `raffle-participant-a-${runId}`;
  const participantBId = `raffle-participant-b-${runId}`;
  const userIds = [adminUserId, viewerUserId, participantAId, participantBId];
  const adminEmail = `raffle-admin-${runId}@example.test`;
  const viewerEmail = `raffle-viewer-${runId}@example.test`;
  const participantAEmail = `raffle-participant-a-${runId}@example.test`;
  const participantBEmail = `raffle-participant-b-${runId}@example.test`;
  const raffleId = `raffle-e2e-${runId}`;
  const defaultRaffleId = `raffle-e2e-default-${runId}`;
  const raffleIds = [raffleId, defaultRaffleId];
  const lotId = `raffle-lot-e2e-${runId}`;
  const defaultLotId = `raffle-lot-default-${runId}`;
  const ticketAId = `raffle-ticket-a-${runId}`;
  const ticketBId = `raffle-ticket-b-${runId}`;
  const ticketCId = `raffle-ticket-c-${runId}`;
  const defaultTicketAId = `raffle-default-ticket-a-${runId}`;
  const defaultTicketBId = `raffle-default-ticket-b-${runId}`;
  const operatorSeed = `synthetic-operator-seed-${runId}`;
  const publicEntropy = `synthetic-post-close-entropy-${runId}`;
  const seedCommitment = createHash('sha256')
    .update(operatorSeed)
    .digest('hex');
  const invalidSeed = `incorrect-operator-seed-${runId}`;
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
      controllers: [AdminRafflesController, RafflesController, MeController],
      providers: [
        RafflesService,
        MeService,
        AdminGuard,
        JwtAuthGuard,
        ViewerGuard,
        JwtStrategy,
        PostAuthThrottlerGuard,
        {
          provide: RealtimeService,
          useValue: {
            notifierPoints: jest.fn(),
            notifierStreak: jest.fn(),
            notifierCarteDebloquee: jest.fn(),
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
          id: adminUserId,
          email: adminEmail,
          passwordHash: 'unused synthetic E2E credential',
          pseudo: `raffle-admin-${runId.slice(0, 10)}`,
          role: 'ADMIN',
        },
        {
          id: viewerUserId,
          email: viewerEmail,
          passwordHash: 'unused synthetic E2E credential',
          pseudo: `raffle-viewer-${runId.slice(0, 10)}`,
          role: 'VIEWER',
        },
        {
          id: participantAId,
          email: participantAEmail,
          passwordHash: 'unused synthetic E2E credential',
          pseudo: `raffle-participant-a-${runId.slice(0, 8)}`,
          role: 'VIEWER',
        },
        {
          id: participantBId,
          email: participantBEmail,
          passwordHash: 'unused synthetic E2E credential',
          pseudo: `raffle-participant-b-${runId.slice(0, 8)}`,
          role: 'VIEWER',
        },
      ],
    });

    const now = Date.now();
    await prisma.raffle.create({
      data: {
        id: raffleId,
        titre: `E2E synthetic raffle ${runId.slice(0, 8)}`,
        description: 'Synthetic fixture for the raffle draw integration test.',
        dateOuverture: new Date(now - 60 * 60_000),
        dateTirage: new Date(now - 1_000),
        engagementGraine: seedCommitment,
        lots: {
          create: [
            {
              id: lotId,
              nom: 'E2E synthetic lot',
              valeurEstimee: '0',
              quantite: 1,
              fournisseur: 'E2E synthetic fixture',
            },
          ],
        },
        tickets: {
          create: [
            { id: ticketAId, userId: participantAId },
            { id: ticketBId, userId: participantBId },
            { id: ticketCId, userId: participantAId },
          ],
        },
      },
    });
  }, 30_000);

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.raffleDrawAudit.deleteMany({
          where: { raffleId: { in: raffleIds } },
        });
        await prisma.raffleWinner.deleteMany({
          where: { raffleId: { in: raffleIds } },
        });
        await prisma.raffleTicket.deleteMany({
          where: { raffleId: { in: raffleIds } },
        });
        await prisma.raffleLot.deleteMany({
          where: { raffleId: { in: raffleIds } },
        });
        await prisma.raffle.deleteMany({ where: { id: { in: raffleIds } } });
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

  it('restricts the draw to admins, publishes an auditable result and refuses commitment/replay', async () => {
    const http = request(app.getHttpServer());
    const adminBearer = await bearerFor(adminUserId, adminEmail);
    const viewerBearer = await bearerFor(viewerUserId, viewerEmail);
    const drawPayload = {
      graineExploitant: operatorSeed,
      entropiePublique: publicEntropy,
    };

    await http
      .post(`/admin/raffles/${raffleId}/draw`)
      .send(drawPayload)
      .expect(401);
    await http
      .post(`/admin/raffles/${raffleId}/draw`)
      .set('Authorization', `Bearer ${viewerBearer}`)
      .send(drawPayload)
      .expect(403);

    const invalidAttempt = await http
      .post(`/admin/raffles/${raffleId}/draw`)
      .set('Authorization', `Bearer ${adminBearer}`)
      .send({ ...drawPayload, graineExploitant: invalidSeed })
      .expect(409);
    expect(invalidAttempt.body).toHaveProperty('message');
    const unchangedRaffle = await prisma.raffle.findUniqueOrThrow({
      where: { id: raffleId },
      select: { statut: true, graineAleatoire: true },
    });
    expect(unchangedRaffle).toEqual({
      statut: 'OUVERT',
      graineAleatoire: null,
    });
    expect(await prisma.raffleDrawAudit.count({ where: { raffleId } })).toBe(0);
    expect(await prisma.raffleWinner.count({ where: { raffleId } })).toBe(0);
    await http.get(`/raffles/${raffleId}/result`).expect(404);

    const drawResponse = await http
      .post(`/admin/raffles/${raffleId}/draw`)
      .set('Authorization', `Bearer ${adminBearer}`)
      .send(drawPayload)
      .expect(201);
    const draw = drawResponse.body as DrawResponse;
    expect(draw.raffleId).toBe(raffleId);
    expect(draw.nombreTickets).toBe(3);
    expect(draw.graineAleatoire).toMatch(/^[0-9a-f]{64}$/);
    expect(draw.empreinteParticipants).toMatch(/^[0-9a-f]{64}$/);

    const [publishedResponse, participantsResponse, persistedRaffle] =
      await Promise.all([
        http.get(`/raffles/${raffleId}/result`).expect(200),
        http.get(`/raffles/${raffleId}/participants`).expect(200),
        prisma.raffle.findUniqueOrThrow({ where: { id: raffleId } }),
      ]);
    const published = publishedResponse.body as PublishedResult;
    const participantList = participantsResponse.body as PublishedParticipants;
    expect(published.statut).toBe('TIRE');
    expect(published.graineAleatoire).toBe(draw.graineAleatoire);
    expect(published.empreinteParticipants).toBe(draw.empreinteParticipants);
    expect(published.nombreParticipants).toBe(3);
    expect(published).not.toHaveProperty('graineExploitant');
    expect(published.gagnants[0]).not.toHaveProperty('userId');
    expect(published.gagnants[0]).not.toHaveProperty('email');

    const canonicalTicketIds = ordreCanonique([
      ticketAId,
      ticketBId,
      ticketCId,
    ]);
    expect(participantList.participants).toEqual(canonicalTicketIds);
    expect(participantList.nombreParticipants).toBe(3);
    const participantFingerprint = calculerEmpreinteParticipants(
      participantList.participants,
    );
    expect(participantList.empreinteParticipants).toBe(participantFingerprint);
    expect(persistedRaffle.empreinteParticipants).toBe(participantFingerprint);

    await http
      .post(`/me/raffles/${raffleId}/register`)
      .set('Authorization', `Bearer ${viewerBearer}`)
      .expect(409);
    const participantsAfterRejectedRegistration = (
      await http.get(`/raffles/${raffleId}/participants`).expect(200)
    ).body as PublishedParticipants;
    expect(participantsAfterRejectedRegistration.participants).toEqual(
      canonicalTicketIds,
    );
    expect(participantsAfterRejectedRegistration.nombreParticipants).toBe(3);
    expect(participantsAfterRejectedRegistration.empreinteParticipants).toBe(
      participantFingerprint,
    );
    expect(await prisma.raffleTicket.count({ where: { raffleId } })).toBe(3);

    const effectiveSeed = createHash('sha256')
      .update(`${operatorSeed}:${publicEntropy}`)
      .digest('hex');
    expect(draw.graineAleatoire).toBe(effectiveSeed);
    expect(persistedRaffle.engagementGraine).toBe(seedCommitment);
    expect(persistedRaffle.entropiePublique).toBe(publicEntropy);
    expect(persistedRaffle.graineAleatoire).toBe(effectiveSeed);
    const expectedWinners = tirerGagnants(effectiveSeed, canonicalTicketIds, [
      { id: lotId, quantite: 1 },
    ]).map((winner) => ({
      ...winner,
      userId: winner.ticketId === ticketBId ? participantBId : participantAId,
    }));
    expect(draw.gagnants).toEqual(expectedWinners);
    expect(
      published.gagnants.map(({ lotId: winnerLotId, ticketId }) => ({
        lotId: winnerLotId,
        ticketId,
      })),
    ).toEqual(
      tirerGagnants(effectiveSeed, participantList.participants, [
        { id: lotId, quantite: 1 },
      ]),
    );

    const audit = await prisma.raffleDrawAudit.findFirstOrThrow({
      where: { raffleId },
    });
    expect(audit.adminUserId).toBe(adminUserId);
    expect(audit.seedCommitment).toBe(seedCommitment);
    expect(audit.resultHash).toBe(
      createHash('sha256')
        .update(JSON.stringify(expectedWinners))
        .digest('hex'),
    );
    expect(persistedRaffle.statut).toBe('TIRE');
    expect(persistedRaffle.resultatPublieAt).not.toBeNull();

    const winnerCountBeforeReplay = await prisma.raffleWinner.count({
      where: { raffleId },
    });
    await http
      .post(`/admin/raffles/${raffleId}/draw`)
      .set('Authorization', `Bearer ${adminBearer}`)
      .send(drawPayload)
      .expect(409);
    expect(await prisma.raffleDrawAudit.count({ where: { raffleId } })).toBe(1);
    expect(await prisma.raffleWinner.count({ where: { raffleId } })).toBe(
      winnerCountBeforeReplay,
    );
  }, 30_000);

  it('uses the default secure seed for an uncommitted worker draw and serves its audit data', async () => {
    const now = Date.now();
    await prisma.raffle.create({
      data: {
        id: defaultRaffleId,
        titre: `E2E default CSPRNG raffle ${runId.slice(0, 8)}`,
        description: 'Synthetic uncommitted raffle for the worker draw path.',
        dateOuverture: new Date(now - 60 * 60_000),
        dateTirage: new Date(now - 1_000),
        engagementGraine: null,
        lots: {
          create: [
            {
              id: defaultLotId,
              nom: 'E2E default CSPRNG lot',
              valeurEstimee: '0',
              quantite: 1,
              fournisseur: 'E2E synthetic fixture',
            },
          ],
        },
        tickets: {
          create: [
            { id: defaultTicketAId, userId: participantAId },
            { id: defaultTicketBId, userId: participantBId },
          ],
        },
      },
    });

    // This is the actual worker/service entry point. No deterministic seed
    // or public entropy is injected; the default generator is exercised.
    const results = await executerTiragesDus(prisma, { adminUserId });
    expect(results).toHaveLength(1);
    const draw = results[0];
    expect(draw.raffleId).toBe(defaultRaffleId);
    expect(draw.graineAleatoire).toMatch(/^[0-9a-f]{64}$/);
    expect(draw.nombreTickets).toBe(2);

    const [publishedResponse, participantsResponse, persistedRaffle, audit] =
      await Promise.all([
        request(app.getHttpServer())
          .get(`/raffles/${defaultRaffleId}/result`)
          .expect(200),
        request(app.getHttpServer())
          .get(`/raffles/${defaultRaffleId}/participants`)
          .expect(200),
        prisma.raffle.findUniqueOrThrow({ where: { id: defaultRaffleId } }),
        prisma.raffleDrawAudit.findFirstOrThrow({
          where: { raffleId: defaultRaffleId },
        }),
      ]);
    const published = publishedResponse.body as PublishedResult;
    const participants = participantsResponse.body as PublishedParticipants;
    const canonicalIds = ordreCanonique([defaultTicketAId, defaultTicketBId]);
    const frozenFingerprint = calculerEmpreinteParticipants(canonicalIds);

    expect(published.statut).toBe('TIRE');
    expect(published.graineAleatoire).toBe(draw.graineAleatoire);
    expect(published.empreinteParticipants).toBe(frozenFingerprint);
    expect(published.nombreParticipants).toBe(2);
    expect(participants.participants).toEqual(canonicalIds);
    expect(participants.empreinteParticipants).toBe(frozenFingerprint);
    expect(persistedRaffle.engagementGraine).toBeNull();
    expect(persistedRaffle.entropiePublique).toBeNull();
    expect(persistedRaffle.graineAleatoire).toBe(draw.graineAleatoire);
    expect(persistedRaffle.empreinteParticipants).toBe(frozenFingerprint);
    expect(audit.adminUserId).toBe(adminUserId);
    expect(audit.seedCommitment).toBe(
      createHash('sha256').update(draw.graineAleatoire).digest('hex'),
    );
    expect(audit.resultHash).toBe(
      createHash('sha256').update(JSON.stringify(draw.gagnants)).digest('hex'),
    );

    const expectedWinners = tirerGagnants(
      draw.graineAleatoire,
      participants.participants,
      [{ id: defaultLotId, quantite: 1 }],
    );
    expect(
      published.gagnants.map(({ lotId: winnerLotId, ticketId }) => ({
        lotId: winnerLotId,
        ticketId,
      })),
    ).toEqual(expectedWinners);
  }, 30_000);
});
