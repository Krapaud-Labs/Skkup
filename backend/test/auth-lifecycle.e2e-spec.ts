import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { io as createSocketClient, type Socket as ClientSocket } from 'socket.io-client';
import type { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AdminGuard } from '../src/auth/guards/admin.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../src/auth/guards/optional-jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { jourConnexion } from '../src/auth/cookie-session';
import { PostAuthThrottlerGuard } from '../src/common/throttler.guards';
import { AdminUsersController } from '../src/admin-users/admin-users.controller';
import { AdminUsersService } from '../src/admin-users/admin-users.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeService } from '../src/realtime/realtime.service';
import { SessionRevocationService } from '../src/auth/session-revocation.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';

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
  const statusAdminId = `auth-e2e-admin-${runId}`;
  const statusTargetId = `auth-e2e-target-${runId}`;
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;
  let userId: string | undefined;
  let socketClient: ClientSocket | undefined;
  let adminStatusSocketClient: ClientSocket | undefined;

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
      controllers: [AuthController, AdminUsersController],
      providers: [
        AuthService,
        AdminUsersService,
        AdminGuard,
        JwtStrategy,
        JwtAuthGuard,
        OptionalJwtAuthGuard,
        PostAuthThrottlerGuard,
        SessionRevocationService,
        RealtimeGateway,
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
    jwt = moduleRef.get(JwtService);
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
        await prisma.contentAuditEvent.deleteMany({
          where: { entityType: 'User', entityId: statusTargetId },
        });
        await prisma.authSession.deleteMany({
          where: { userId: { in: [statusAdminId, statusTargetId] } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: [statusAdminId, statusTargetId] } },
        });
      }
    } finally {
      socketClient?.disconnect();
      adminStatusSocketClient?.disconnect();
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

    const server = app.getHttpServer();
    if (!server.listening) {
      await app.listen(0, '127.0.0.1');
    }
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('The auth lifecycle HTTP server did not bind a TCP port.');
    }
    const origin = `http://127.0.0.1:${address.port}`;
    process.env.CORS_ORIGINS = origin;
    socketClient = createSocketClient(origin, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 5_000,
      extraHeaders: { Origin: origin, Cookie: cookiePair },
    });
    await new Promise<void>((resolve, reject) => {
      socketClient?.once('connect', resolve);
      socketClient?.once('connect_error', reject);
    });
    expect(socketClient.connected).toBe(true);

    const socketClosed = new Promise<string>((resolve) => {
      socketClient?.once('disconnect', resolve);
    });
    await http
      .post('/auth/logout')
      .set('Cookie', cookiePair)
      .expect(204)
      .expect(({ headers }) => {
        expect(headers['set-cookie']?.[0]).toContain('__Host-vr_session=;');
        expect(headers['set-cookie']?.[0]).toContain(
          'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        );
      });
    await expect(socketClosed).resolves.toBe('io server disconnect');
    expect(socketClient.connected).toBe(false);

    const revokedSessionA = await http
      .get('/auth/session')
      .set('Cookie', cookiePair)
      .expect(200);
    expect(revokedSessionA.body).toEqual({ authentifie: false, profil: null });
    const activeSessionB = await http
      .get('/auth/session')
      .set('Cookie', loginCookiePair)
      .expect(200);
    expect(activeSessionB.body).toMatchObject({
      authentifie: true,
      profil: { id: createdUser.id },
    });
    const userAfterLogout = await prisma.user.findUniqueOrThrow({
      where: { id: createdUser.id },
      select: { sessionVersion: true },
    });
    expect(userAfterLogout.sessionVersion).toBe(createdUser.sessionVersion);

    const sidA = jwt.verify<{ sid: string }>(cookiePair.split('=')[1]).sid;
    const sidB = jwt.verify<{ sid: string }>(loginCookiePair.split('=')[1]).sid;
    const sessionA = await prisma.authSession.findUniqueOrThrow({
      where: { id: sidA },
      select: { userId: true, revokedAt: true },
    });
    expect(sessionA).toMatchObject({ userId: createdUser.id });
    expect(sessionA.revokedAt).toBeInstanceOf(Date);

    const nouveauMotDePasse = 'Mvp-Auth-E2e-Global-2026!';
    await http
      .patch('/auth/password')
      .set('Cookie', loginCookiePair)
      .send({ ancienMotDePasse: PASSWORD, nouveauMotDePasse })
      .expect(204);
    await http
      .get('/auth/session')
      .set('Cookie', loginCookiePair)
      .expect(200)
      .expect({ authentifie: false, profil: null });
    const userAfterPasswordChange = await prisma.user.findUniqueOrThrow({
      where: { id: createdUser.id },
      select: { sessionVersion: true },
    });
    expect(userAfterPasswordChange.sessionVersion).toBe(
      createdUser.sessionVersion + 1,
    );
    const sessionB = await prisma.authSession.findUniqueOrThrow({
      where: { id: sidB },
      select: { revokedAt: true },
    });
    expect(sessionB.revokedAt).toBeInstanceOf(Date);

    await http
      .post('/auth/logout')
      .set('Cookie', '__Host-vr_session=not-a-jwt')
      .expect(204)
      .expect(({ headers }) => {
        expect(headers['set-cookie']?.[0]).toContain('__Host-vr_session=;');
      });
    const expiredToken = await jwt.signAsync(
      {
        sub: createdUser.id,
        email,
        sid: randomUUID(),
      },
      { expiresIn: '-1s' },
    );
    await http
      .post('/auth/logout')
      .set('Cookie', `__Host-vr_session=${expiredToken}`)
      .expect(204)
      .expect(({ headers }) => {
        expect(headers['set-cookie']?.[0]).toContain('__Host-vr_session=;');
      });
  }, 30_000);

  it('désactive puis réactive un compte Viewer via admin et persiste les deux audits', async () => {
    await prisma.user.createMany({
      data: [
        {
          id: statusAdminId,
          email: `${statusAdminId}@example.test`,
          passwordHash: 'unused synthetic E2E credential',
          pseudo: `status-admin-${runId.slice(0, 8)}`,
          role: 'ADMIN',
        },
        {
          id: statusTargetId,
          email: `${statusTargetId}@example.test`,
          passwordHash: 'unused synthetic E2E credential',
          pseudo: `status-target-${runId.slice(0, 8)}`,
          role: 'VIEWER',
        },
      ],
    });

    const adminSessionId = randomUUID();
    const targetSessionId = randomUUID();
    await prisma.authSession.createMany({
      data: [
        {
          id: adminSessionId,
          userId: statusAdminId,
          sessionVersion: 0,
          expiresAt: new Date(Date.now() + 60 * 60_000),
        },
        {
          id: targetSessionId,
          userId: statusTargetId,
          sessionVersion: 0,
          expiresAt: new Date(Date.now() + 60 * 60_000),
        },
      ],
    });
    const adminBearer = await jwt.signAsync({
      sub: statusAdminId,
      email: `${statusAdminId}@example.test`,
      sid: adminSessionId,
      sessionVersion: 0,
      jourConnexion: jourConnexion(),
    });
    const viewerBearer = await jwt.signAsync({
      sub: statusTargetId,
      email: `${statusTargetId}@example.test`,
      sid: targetSessionId,
      sessionVersion: 0,
      jourConnexion: jourConnexion(),
    });
    const http = request(app.getHttpServer());
    const statusUrl = `/admin/users/${statusTargetId}/status`;

    const server = app.getHttpServer();
    if (!server.listening) {
      await app.listen(0, '127.0.0.1');
    }
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('The auth lifecycle HTTP server did not bind a TCP port.');
    }
    const origin = `http://127.0.0.1:${address.port}`;
    process.env.CORS_ORIGINS = origin;
    adminStatusSocketClient = createSocketClient(origin, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 5_000,
      extraHeaders: {
        Origin: origin,
        Authorization: `Bearer ${viewerBearer}`,
      },
    });
    await new Promise<void>((resolve, reject) => {
      adminStatusSocketClient?.once('connect', resolve);
      adminStatusSocketClient?.once('connect_error', reject);
    });
    expect(adminStatusSocketClient.connected).toBe(true);
    const socketClosed = new Promise<string>((resolve) => {
      adminStatusSocketClient?.once('disconnect', resolve);
    });

    await http.patch(statusUrl).send({ actif: false }).expect(401);
    await http
      .patch(statusUrl)
      .set('Authorization', `Bearer ${viewerBearer}`)
      .send({ actif: false })
      .expect(403);

    expect(adminStatusSocketClient.connected).toBe(true);
    await http
      .patch(statusUrl)
      .set('Authorization', `Bearer ${adminBearer}`)
      .send({ actif: false })
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ id: statusTargetId, actif: false }),
      );
    await expect(socketClosed).resolves.toBe('io server disconnect');
    expect(adminStatusSocketClient.connected).toBe(false);

    const disabledUser = await prisma.user.findUniqueOrThrow({
      where: { id: statusTargetId },
      select: { actif: true, sessionVersion: true },
    });
    const revokedTargetSession = await prisma.authSession.findUniqueOrThrow({
      where: { id: targetSessionId },
      select: { revokedAt: true },
    });
    expect(disabledUser).toEqual({ actif: false, sessionVersion: 1 });
    expect(revokedTargetSession.revokedAt).toBeInstanceOf(Date);

    await http
      .patch(statusUrl)
      .set('Authorization', `Bearer ${adminBearer}`)
      .send({ actif: true })
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ id: statusTargetId, actif: true }),
      );

    const reactivatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: statusTargetId },
      select: { actif: true, sessionVersion: true },
    });
    expect(reactivatedUser).toEqual({ actif: true, sessionVersion: 1 });
    const auditEvents = await prisma.contentAuditEvent.findMany({
      where: { entityType: 'User', entityId: statusTargetId },
      select: { action: true, actorId: true, entityId: true, metadata: true },
    });
    expect(auditEvents).toHaveLength(2);
    expect(auditEvents).toEqual(
      expect.arrayContaining([
        {
          action: 'USER_DEACTIVATED',
          actorId: statusAdminId,
          entityId: statusTargetId,
          metadata: { previousActif: true, actif: false },
        },
        {
          action: 'USER_ACTIVATED',
          actorId: statusAdminId,
          entityId: statusTargetId,
          metadata: { previousActif: false, actif: true },
        },
      ]),
    );
  }, 30_000);
});
