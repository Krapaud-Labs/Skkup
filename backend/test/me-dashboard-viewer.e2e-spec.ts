import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { jourConnexion } from '../src/auth/cookie-session';
import { MeModule } from '../src/me/me.module';
import { MeService } from '../src/me/me.service';
import { RealtimeBridge } from '../src/realtime/realtime.bridge';
import request from 'supertest';
import type { App } from 'supertest/types';

// AuthModule captures JWT_SECRET while MeModule is imported. Sign test tokens
// with that initial value instead of mutating the environment in beforeAll.
const JWT_SECRET = process.env.JWT_SECRET ?? 'test-only-jwt-secret-for-e2e';

describe('GET /me/dashboard/summary (audience HTTP)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const userFindUnique = jest.fn();
  const resumeDashboard = jest
    .fn()
    .mockResolvedValue({ profil: { id: 'viewer-1' } });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PrismaModule,
        PassportModule,
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
        MeModule,
      ],
      providers: [JwtStrategy],
    })
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: userFindUnique } })
      .overrideProvider(MeService)
      .useValue({ resumeDashboard })
      .overrideProvider(RealtimeBridge)
      .useValue({ onModuleInit: jest.fn(), onModuleDestroy: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  beforeEach(() => {
    userFindUnique.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({
        id: where.id,
        email: `${where.id}@example.test`,
        sessionVersion: 0,
        actif: true,
        role: where.id === 'viewer-1' ? 'VIEWER' : 'ADMIN',
      }),
    );
    resumeDashboard.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  async function bearerFor(sub: string): Promise<string> {
    return jwt.signAsync({
      sub,
      email: `${sub}@example.test`,
      sessionVersion: 0,
      jourConnexion: jourConnexion(),
    });
  }

  it('refuse une requête anonyme avec 401', async () => {
    await request(app.getHttpServer()).get('/me/dashboard/summary').expect(401);
    expect(resumeDashboard).not.toHaveBeenCalled();
  });

  it('autorise VIEWER et appelle le service pour son identité', async () => {
    await request(app.getHttpServer())
      .get('/me/dashboard/summary')
      .set('Authorization', `Bearer ${await bearerFor('viewer-1')}`)
      .expect(200)
      .expect({ profil: { id: 'viewer-1' } });
    expect(resumeDashboard).toHaveBeenCalledWith('viewer-1');
  });

  it('refuse ADMIN avec 403 avant le service', async () => {
    await request(app.getHttpServer())
      .get('/me/dashboard/summary')
      .set('Authorization', `Bearer ${await bearerFor('admin-1')}`)
      .expect(403);
    expect(resumeDashboard).not.toHaveBeenCalled();
  });
});
