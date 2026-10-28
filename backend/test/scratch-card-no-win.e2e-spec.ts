import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { jourConnexion } from '../src/auth/cookie-session';
import { PostAuthThrottlerGuard } from '../src/common/throttler.guards';
import { ScratchCardsController } from '../src/scratch-cards/scratch-cards.controller';
import { ScratchCardsService } from '../src/scratch-cards/scratch-cards.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeService } from '../src/realtime/realtime.service';
import { MeController } from '../src/me/me.controller';
import { MeService } from '../src/me/me.service';
import { ViewerGuard } from '../src/auth/guards/viewer.guard';

const JWT_SECRET = 'isolated-scratch-card-no-win-e2e-only-secret';

interface DashboardSummaryResponse {
  transactionsRecentes: Array<{
    type: string;
    montant: number;
    session: unknown;
  }>;
}

function assertSafeE2eDatabase(databaseUrl: string | undefined): void {
  if (process.env.SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE !== '1') {
    throw new Error(
      'Set SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE=1 only for an isolated test database.',
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
      `Refusing scratch-card E2E against ${url.hostname}/${databaseName}; use a local database named *_test or *_qa.`,
    );
  }
}

describe('scratch card with no win (HTTP + PostgreSQL integration)', () => {
  const runId = randomUUID();
  const userId = `scratch-no-win-e2e-${runId}`;
  const email = `scratch-no-win-e2e-${runId}@example.test`;
  const pseudo = `scratch-no-win-${runId.slice(0, 12)}`;
  const cardId = `scratch-no-win-card-${runId}`;
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;
  const notifierPoints = jest.fn();

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
      controllers: [ScratchCardsController, MeController],
      providers: [
        ScratchCardsService,
        MeService,
        JwtAuthGuard,
        JwtStrategy,
        ViewerGuard,
        PostAuthThrottlerGuard,
        {
          provide: RealtimeService,
          useValue: {
            notifierPoints,
            notifierStreak: jest.fn(),
            notifierCarteDebloquee: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);

    await prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash: 'unused synthetic E2E credential',
        pseudo,
        role: 'VIEWER',
        soldePoints: 37,
      },
    });
    await prisma.scratchCard.create({
      data: {
        id: cardId,
        userId,
        streakPalier: 14,
        gainType: 'RIEN',
        gainMontant: 0,
        gainPrepareAt: new Date(),
      },
    });
  }, 30_000);

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.pointsTransaction.deleteMany({ where: { userId } });
        await prisma.scratchCard.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
      }
    } finally {
      await app?.close();
    }
  });

  async function bearerForViewer(): Promise<string> {
    return jwt.signAsync({
      sub: userId,
      email,
      sessionVersion: 0,
      jourConnexion: jourConnexion(),
    });
  }

  it('records zero activity without credit or points notification and rejects replay', async () => {
    const bearer = await bearerForViewer();
    const response = await request(app.getHttpServer())
      .post(`/me/scratch-cards/${cardId}/scratch`)
      .set('Authorization', `Bearer ${bearer}`)
      .expect(201);

    expect(response.body).toMatchObject({
      carte: {
        id: cardId,
        grattee: true,
        gainType: 'rien',
        gainMontant: 0,
      },
      ticketCree: false,
    });

    const [user, transactions, card] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { soldePoints: true },
      }),
      prisma.pointsTransaction.findMany({
        where: { userId, type: 'CARTE_A_GRATTER' },
      }),
      prisma.scratchCard.findUniqueOrThrow({ where: { id: cardId } }),
    ]);

    expect(user.soldePoints).toBe(37);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].montant).toBe(0);
    expect(card.grattee).toBe(true);
    expect(notifierPoints).not.toHaveBeenCalled();

    const summary = await request(app.getHttpServer())
      .get('/me/dashboard/summary')
      .set('Authorization', `Bearer ${bearer}`)
      .expect(200);
    const dashboard = summary.body as DashboardSummaryResponse;
    expect(dashboard.transactionsRecentes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CARTE_A_GRATTER',
          montant: 0,
          session: null,
        }),
      ]),
    );

    await request(app.getHttpServer())
      .post(`/me/scratch-cards/${cardId}/scratch`)
      .set('Authorization', `Bearer ${bearer}`)
      .expect(409);

    expect(
      await prisma.pointsTransaction.count({
        where: { userId, type: 'CARTE_A_GRATTER' },
      }),
    ).toBe(1);
    expect(
      await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { soldePoints: true },
      }),
    ).toMatchObject({ soldePoints: 37 });
    expect(notifierPoints).not.toHaveBeenCalled();
  }, 30_000);
});
