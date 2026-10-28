import { randomUUID } from 'node:crypto';
import {
  Controller,
  Get,
  INestApplication,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Request } from 'express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { SessionRevocationService } from '../src/auth/session-revocation.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { jourConnexion } from '../src/auth/cookie-session';
import { PostAuthThrottlerGuard } from '../src/common/throttler.guards';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeService } from '../src/realtime/realtime.service';
import { ExtensionAuthGuard } from '../src/extension/extension-auth.guard';
import { ExtensionController } from '../src/extension/extension.controller';
import { ExtensionService } from '../src/extension/extension.service';
import {
  empreinteJeton,
  genererCodeAppariement,
  normaliserCodeAppariement,
} from '../src/extension/jetons-extension';

const JWT_SECRET = 'isolated-extension-pairing-e2e-only-secret';
const DUREE_CODE_MS = 5 * 60 * 1000;
const DUREE_JETON_MS = 30 * 24 * 60 * 60 * 1000;

interface ExtensionProbeRequest extends Request {
  user?: { userId: string; email: string; appariementId: string };
}

interface PairingTokenResponse {
  code: string;
  expireAt: string;
}

interface PairResponse {
  jetonExtension: string;
  expireAt: string;
  pseudo: string;
}

interface PairingsResponse {
  appareils: Array<{ id: string; statut: string }>;
}

interface CredentialProbeResponse {
  userId: string;
  appariementId: string;
}

/** Route de test uniquement, pour exercer le vrai garde du credential émis. */
@Controller('e2e/extension')
class ExtensionCredentialProbeController {
  @Get('credential')
  @UseGuards(ExtensionAuthGuard)
  credential(@Req() request: ExtensionProbeRequest) {
    return {
      userId: request.user?.userId,
      appariementId: request.user?.appariementId,
    };
  }
}

function assertSafeE2eDatabase(databaseUrl: string | undefined): void {
  if (process.env.EXTENSION_E2E_ALLOW_DATABASE !== '1') {
    throw new Error(
      'Set EXTENSION_E2E_ALLOW_DATABASE=1 only for an isolated test database.',
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
      `Refusing extension pairing E2E against ${url.hostname}/${databaseName}; use a local database named *_test or *_qa.`,
    );
  }
}

describe('extension pairing (HTTP + PostgreSQL integration)', () => {
  const runId = randomUUID();
  const userId = `extension-e2e-${runId}`;
  const otherUserId = `extension-e2e-other-${runId}`;
  const email = `extension-e2e-${runId}@example.test`;
  const otherEmail = `extension-e2e-other-${runId}@example.test`;
  const pseudo = `extension-e2e-${runId.slice(0, 12)}`;
  const otherPseudo = `extension-e2e-other-${runId.slice(0, 10)}`;
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
          { name: 'default', ttl: 60 * 60_000, limit: 120 },
        ]),
      ],
      controllers: [ExtensionController, ExtensionCredentialProbeController],
      providers: [
        ExtensionService,
        ExtensionAuthGuard,
        JwtAuthGuard,
        JwtStrategy,
        PostAuthThrottlerGuard,
        SessionRevocationService,
        {
          provide: RealtimeService,
          useValue: { notifierAppariements: jest.fn() },
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

    await prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash: 'unused synthetic E2E credential',
        pseudo,
      },
    });
    await prisma.user.create({
      data: {
        id: otherUserId,
        email: otherEmail,
        passwordHash: 'unused synthetic E2E credential',
        pseudo: otherPseudo,
      },
    });
  }, 30_000);

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.extensionPairingToken.deleteMany({ where: { userId } });
        await prisma.extensionPairing.deleteMany({ where: { userId } });
        await prisma.extensionPairingToken.deleteMany({
          where: { userId: otherUserId },
        });
        await prisma.extensionPairing.deleteMany({
          where: { userId: otherUserId },
        });
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.user.deleteMany({ where: { id: otherUserId } });
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

  async function bearerForOtherViewer(): Promise<string> {
    return jwt.signAsync({
      sub: otherUserId,
      email: otherEmail,
      sessionVersion: 0,
      jourConnexion: jourConnexion(),
    });
  }

  async function pairWithCode(code: string, expectedStatus = 200) {
    return request(app.getHttpServer())
      .post('/extension/pair')
      .send({ code })
      .expect(expectedStatus);
  }

  it('authenticates code generation, consumes once, lists/revokes pairings and enforces limits', async () => {
    const http = request(app.getHttpServer());
    const viewerBearer = await bearerForViewer();
    const otherViewerBearer = await bearerForOtherViewer();

    await http.post('/extension/pairing-token').expect(401);

    const generated = await http
      .post('/extension/pairing-token')
      .set('Authorization', `Bearer ${viewerBearer}`)
      .expect(201);
    const receivedCodeAt = Date.now();
    const generatedBody = generated.body as PairingTokenResponse;
    const code = generatedBody.code;
    const codeExpiresAt = new Date(generatedBody.expireAt);
    expect(code).toMatch(
      /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/,
    );
    expect(codeExpiresAt.getTime() - receivedCodeAt).toBeGreaterThan(290_000);
    expect(codeExpiresAt.getTime() - receivedCodeAt).toBeLessThanOrEqual(
      DUREE_CODE_MS,
    );

    const normalizedCode = normaliserCodeAppariement(code);
    expect(normalizedCode).not.toBeNull();
    const codeRecord = await prisma.extensionPairingToken.findUniqueOrThrow({
      where: { tokenHash: empreinteJeton(normalizedCode as string) },
    });
    expect(codeRecord.userId).toBe(userId);
    expect(codeRecord.tokenHash).toBe(empreinteJeton(normalizedCode as string));
    expect(codeRecord.tokenHash).not.toContain(code);
    expect(codeRecord.expireAt.getTime()).toBe(codeExpiresAt.getTime());
    expect(codeRecord.consommeAt).toBeNull();

    const paired = await pairWithCode(code);
    const pairedBody = paired.body as PairResponse;
    expect(pairedBody.pseudo).toBe(pseudo);
    const credential = pairedBody.jetonExtension;
    const credentialExpiresAt = new Date(pairedBody.expireAt);
    expect(credential).toMatch(/^vrx_[A-Za-z0-9_-]+$/);
    expect(credentialExpiresAt.getTime() - Date.now()).toBeGreaterThan(
      DUREE_JETON_MS - 60_000,
    );
    expect(credentialExpiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
      DUREE_JETON_MS,
    );

    const consumedCode = await prisma.extensionPairingToken.findUniqueOrThrow({
      where: { id: codeRecord.id },
    });
    expect(consumedCode.consommeAt).not.toBeNull();
    const pairing = await prisma.extensionPairing.findUniqueOrThrow({
      where: { tokenHash: empreinteJeton(credential) },
    });
    expect(pairing.userId).toBe(userId);
    expect(pairing.tokenHash).not.toBe(credential);
    expect(pairing.expireAt.getTime()).toBe(credentialExpiresAt.getTime());

    const activeProbe = await http
      .get('/e2e/extension/credential')
      .set('Authorization', `Bearer ${credential}`)
      .expect(200);
    expect(activeProbe.body as CredentialProbeResponse).toEqual({
      userId,
      appariementId: pairing.id,
    });

    const initialList = await http
      .get('/extension/pairings')
      .set('Authorization', `Bearer ${viewerBearer}`)
      .expect(200);
    const initialListBody = initialList.body as PairingsResponse;
    expect(initialListBody.appareils).toHaveLength(1);
    expect(initialListBody.appareils[0]).toMatchObject({
      id: pairing.id,
      statut: 'ACTIF',
    });

    await http
      .delete(`/extension/pairings/${pairing.id}`)
      .set('Authorization', `Bearer ${otherViewerBearer}`)
      .expect(403);
    await http
      .get('/e2e/extension/credential')
      .set('Authorization', `Bearer ${credential}`)
      .expect(200);

    await pairWithCode(code, 401);

    await http
      .delete(`/extension/pairings/${pairing.id}`)
      .set('Authorization', `Bearer ${viewerBearer}`)
      .expect(204);
    const revokedList = await http
      .get('/extension/pairings')
      .set('Authorization', `Bearer ${viewerBearer}`)
      .expect(200);
    expect((revokedList.body as PairingsResponse).appareils).toEqual([
      expect.objectContaining({ id: pairing.id, statut: 'REVOQUE' }),
    ]);
    await http
      .get('/e2e/extension/credential')
      .set('Authorization', `Bearer ${credential}`)
      .expect(401);

    const expiringResponse = await http
      .post('/extension/pairing-token')
      .set('Authorization', `Bearer ${viewerBearer}`)
      .expect(201);
    const expiringCode = (expiringResponse.body as PairingTokenResponse).code;
    const normalizedExpiringCode = normaliserCodeAppariement(expiringCode);
    expect(normalizedExpiringCode).not.toBeNull();
    await prisma.extensionPairingToken.update({
      where: { tokenHash: empreinteJeton(normalizedExpiringCode as string) },
      data: { expireAt: new Date(Date.now() - 1) },
    });
    await pairWithCode(expiringCode, 401);

    // The HTTP code generator deliberately permits one active code per user
    // and is throttled to five generations/hour. Seed only the six synthetic
    // one-use tokens required to exercise the five-device service cap.
    const capTestCodes = Array.from({ length: 6 }, () =>
      genererCodeAppariement(),
    );
    await prisma.extensionPairingToken.createMany({
      data: capTestCodes.map(({ codeNormalise }) => ({
        userId,
        tokenHash: empreinteJeton(codeNormalise),
        expireAt: new Date(Date.now() + DUREE_CODE_MS),
      })),
    });

    const capPairings: Array<{ id: string; credential: string }> = [];
    for (const { code } of capTestCodes) {
      const response = await pairWithCode(code);
      const deviceCredential = (response.body as PairResponse).jetonExtension;
      const storedPairing = await prisma.extensionPairing.findUniqueOrThrow({
        where: { tokenHash: empreinteJeton(deviceCredential) },
        select: { id: true },
      });
      capPairings.push({ id: storedPairing.id, credential: deviceCredential });
      if (capPairings.length === 1) {
        await prisma.extensionPairing.update({
          where: { id: storedPairing.id },
          data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
        });
      }
    }

    const cappedPairings = await prisma.extensionPairing.findMany({
      where: { userId, revoqueAt: null, expireAt: { gt: new Date() } },
    });
    expect(cappedPairings).toHaveLength(5);
    const oldestPairing = await prisma.extensionPairing.findUniqueOrThrow({
      where: { id: capPairings[0].id },
      select: { revoqueAt: true },
    });
    expect(oldestPairing.revoqueAt).not.toBeNull();
    await http
      .get('/e2e/extension/credential')
      .set('Authorization', `Bearer ${capPairings[0].credential}`)
      .expect(401);
  }, 30_000);
});
