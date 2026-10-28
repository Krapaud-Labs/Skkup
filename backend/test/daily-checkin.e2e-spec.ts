import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
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
import { MeController } from '../src/me/me.controller';
import { MeService } from '../src/me/me.service';
import { ViewerGuard } from '../src/auth/guards/viewer.guard';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeService } from '../src/realtime/realtime.service';

const JWT_SECRET = 'isolated-daily-checkin-e2e-only-secret';
const STREAK_MILESTONES = [3, 7, 14, 30] as const;

interface CheckinResponse {
  streakActuel: number;
  streakMax: number;
  soldePoints: number;
  pointsCredites: number;
  carteDebloquee: { id: string; streakPalier: number } | null;
}

type CheckinRequest = ReturnType<ReturnType<typeof request>['post']>;

function assertSafeE2eDatabase(databaseUrl: string | undefined): void {
  if (process.env.DAILY_CHECKIN_E2E_ALLOW_DATABASE !== '1') {
    throw new Error(
      'Set DAILY_CHECKIN_E2E_ALLOW_DATABASE=1 only for an isolated test database.',
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
      `Refusing daily check-in E2E against ${url.hostname}/${databaseName}; use a local database named *_test or *_qa.`,
    );
  }
}

/** A noon local-time fixture avoids DST boundary hours and mirrors service TZ. */
function localDayOffset(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

describe('daily check-in (HTTP + PostgreSQL integration)', () => {
  const runId = randomUUID();
  const userId = `daily-checkin-e2e-${runId}`;
  const email = `daily-checkin-e2e-${runId}@example.test`;
  const pseudo = `daily-e2e-${runId.slice(0, 12)}`;
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;

  async function createHttpApplication(): Promise<void> {
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
      controllers: [MeController],
      providers: [
        MeService,
        JwtAuthGuard,
        JwtStrategy,
        ViewerGuard,
        PostAuthThrottlerGuard,
        SessionRevocationService,
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
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
  }

  beforeAll(async () => {
    assertSafeE2eDatabase(process.env.DATABASE_URL);
    process.env.JWT_SECRET = JWT_SECRET;
    await createHttpApplication();

    await prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash: 'unused synthetic E2E credential',
        pseudo,
        role: 'VIEWER',
        soldePoints: 0,
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

  function checkin(bearer: string): CheckinRequest {
    return request(app.getHttpServer())
      .post('/me/daily-checkin')
      .set('Authorization', `Bearer ${bearer}`);
  }

  async function seedPreviousDayStreak(streak: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        streakActuel: streak,
        streakMax: Math.max(streak, 0),
        derniereVisiteAt: localDayOffset(-1),
      },
    });
  }

  async function assertBalanceMatchesLedger(): Promise<void> {
    const [user, ledger] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { soldePoints: true },
      }),
      prisma.pointsTransaction.aggregate({
        where: { userId },
        _sum: { montant: true },
      }),
    ]);
    expect(user.soldePoints).toBe(ledger._sum.montant ?? 0);
  }

  it('tracks milestones, rejects same-day replay, resets after a missed day, and preserves earned cards', async () => {
    const earnedCardIds = new Set<string>();

    for (const milestone of STREAK_MILESTONES) {
      await seedPreviousDayStreak(milestone - 1);

      const response = await checkin(await bearerForViewer()).expect(201);
      const result = response.body as CheckinResponse;
      expect(result.streakActuel).toBe(milestone);
      expect(result.streakMax).toBeGreaterThanOrEqual(milestone);
      expect(result.carteDebloquee?.streakPalier).toBe(milestone);

      const milestoneCards = await prisma.scratchCard.findMany({
        where: { userId, streakPalier: milestone },
        select: { id: true, streakPalier: true },
      });
      expect(milestoneCards).toHaveLength(1);
      earnedCardIds.add(milestoneCards[0].id);
      await assertBalanceMatchesLedger();
    }

    const beforeReplay = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          soldePoints: true,
          streakActuel: true,
          derniereVisiteAt: true,
        },
      }),
      prisma.pointsTransaction.count({ where: { userId } }),
      prisma.scratchCard.count({ where: { userId } }),
    ]);
    await checkin(await bearerForViewer()).expect(409);
    const afterReplay = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          soldePoints: true,
          streakActuel: true,
          derniereVisiteAt: true,
        },
      }),
      prisma.pointsTransaction.count({ where: { userId } }),
      prisma.scratchCard.count({ where: { userId } }),
    ]);
    expect(afterReplay).toEqual(beforeReplay);
    await assertBalanceMatchesLedger();

    // The production route allows five attempts per minute. Recreate only
    // the isolated Nest application before this independent gap scenario so
    // the real in-memory throttler starts clean; HTTP guards and Prisma stay real.
    await app.close();
    await createHttpApplication();
    await prisma.user.update({
      where: { id: userId },
      data: {
        streakActuel: 30,
        streakMax: 30,
        derniereVisiteAt: localDayOffset(-2),
      },
    });
    const gapResponse = await checkin(await bearerForViewer()).expect(201);
    const afterGap = gapResponse.body as CheckinResponse;
    expect(afterGap.streakActuel).toBe(1);
    expect(afterGap.streakMax).toBe(30);

    const preservedCards = await prisma.scratchCard.findMany({
      where: { userId },
      select: { id: true, streakPalier: true },
    });
    expect(new Set(preservedCards.map(({ id }) => id))).toEqual(earnedCardIds);
    for (const milestone of STREAK_MILESTONES) {
      expect(
        preservedCards.filter((card) => card.streakPalier === milestone),
      ).toHaveLength(1);
    }
    await assertBalanceMatchesLedger();
  }, 30_000);
});
