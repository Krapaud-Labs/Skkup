import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../src/auth/guards/optional-jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { PostAuthThrottlerGuard } from '../src/common/throttler.guards';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeService } from '../src/realtime/realtime.service';
import { SessionRevocationService } from '../src/auth/session-revocation.service';

const JWT_SECRET = 'isolated-auth-lifecycle-e2e-only-secret';
const PASSWORD = 'Mvp-Auth-E2e-2026!';

function assertSafeE2eDatabase(databaseUrl: string | undefined): void {
  if (process.env.AUTH_E2E_ALLOW_DATABASE !== '1') {
    throw new Error(
      'Set AUTH_E2E_ALLOW_DATABASE=1 only for an isolated test database.',
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
      `Refusing auth lifecycle E2E against ${url.hostname}/${databaseName}; use a local database named *_test or *_qa.`,
    );
  }
}

describe('auth lifecycle (HTTP + PostgreSQL integration)', () => {
  const runId = randomUUID();
  const email = `auth-e2e-${runId}@example.test`;
  const pseudo = `auth-e2e-${runId.slice(0, 12)}`;
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userId: string | undefined;

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
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        OptionalJwtAuthGuard,
        PostAuthThrottlerGuard,
        SessionRevocationService,
        {
          provide: RealtimeService,
          useValue: { notifierNombreUtilisateurs: jest.fn() },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = moduleRef.get(PrismaService);
  }, 30_000);

  afterAll(async () => {
    try {
      if (prisma) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        const idToDelete = userId ?? user?.id;
        if (idToDelete) {
          await prisma.user.deleteMany({ where: { id: idToDelete } });
        }
      }
    } finally {
      await app?.close();
    }
  });

  it('registers, reads the session cookie, logs in and revokes on logout', async () => {
    const http = request(app.getHttpServer());

    const anonymous = await http.get('/auth/session').expect(200);
    expect(anonymous.body).toEqual({ authentifie: false, profil: null });

    const registration = await http
      .post('/auth/register')
      .send({
        email,
        pseudo,
        motDePasse: PASSWORD,
        accepteReglement: true,
      })
      .expect(201);
    expect(registration.body).toEqual({ pseudo });
    expect(registration.body).not.toHaveProperty('accessToken');

    const registrationCookie = registration.headers['set-cookie']?.[0];
    expect(registrationCookie).toEqual(
      expect.stringContaining('__Host-vr_session='),
    );
    if (!registrationCookie) throw new Error('Registration cookie is missing.');
    expect(registrationCookie).toEqual(expect.stringContaining('HttpOnly'));
    expect(registrationCookie).toEqual(expect.stringContaining('SameSite=Lax'));
    expect(registrationCookie).toEqual(expect.stringContaining('Path=/'));
    expect(registrationCookie).toEqual(expect.stringContaining('Secure'));
    const cookiePair = registrationCookie.split(';', 1)[0];

    const createdUser = await prisma.user.findUniqueOrThrow({
      where: { email },
      select: {
        id: true,
        pseudo: true,
        passwordHash: true,
        sessionVersion: true,
      },
    });
    userId = createdUser.id;
    expect(createdUser.pseudo).toBe(pseudo);
    expect(createdUser.passwordHash).not.toBe(PASSWORD);

    const registeredSession = await http
      .get('/auth/session')
      .set('Cookie', cookiePair)
      .expect(200);
    expect(registeredSession.body).toMatchObject({
      authentifie: true,
      profil: { id: createdUser.id, email, pseudo, role: 'VIEWER' },
    });

    const login = await http
      .post('/auth/login')
      .send({ email, motDePasse: PASSWORD })
      .expect(200);
    expect(login.body).toEqual({ pseudo });
    expect(login.body).not.toHaveProperty('accessToken');
    const loginCookie = login.headers['set-cookie']?.[0];
    expect(loginCookie).toEqual(expect.stringContaining('__Host-vr_session='));
    if (!loginCookie) throw new Error('Login cookie is missing.');
    const loginCookiePair = loginCookie.split(';', 1)[0];
    await http
      .get('/auth/session')
      .set('Cookie', loginCookiePair)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          authentifie: true,
          profil: { id: createdUser.id },
        });
      });

    await http
      .post('/auth/logout')
      .set('Cookie', loginCookiePair)
      .expect(204)
      .expect(({ headers }) => {
        expect(headers['set-cookie']?.[0]).toContain('__Host-vr_session=;');
        expect(headers['set-cookie']?.[0]).toContain(
          'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        );
      });

    const revokedSession = await http
      .get('/auth/session')
      .set('Cookie', loginCookiePair)
      .expect(200);
    expect(revokedSession.body).toEqual({ authentifie: false, profil: null });
    const userAfterLogout = await prisma.user.findUniqueOrThrow({
      where: { id: createdUser.id },
      select: { sessionVersion: true },
    });
    expect(userAfterLogout.sessionVersion).toBe(createdUser.sessionVersion + 1);
  }, 30_000);
});
