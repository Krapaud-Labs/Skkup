import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { AnnouncementsModule } from '../src/announcements/announcements.module';
import { AnnouncementsService } from '../src/announcements/announcements.service';
import { jourConnexion } from '../src/auth/cookie-session';
import request from 'supertest';
import type { App } from 'supertest/types';

const JWT_SECRET = 'viewer-announcements-http-test-secret';

describe('GET /viewer/announcements (HTTP integration)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const userFindUnique = jest.fn();
  const annonces = {
    items: [{ id: 'annonce-1', titre: 'Info', texte: 'Texte brut' }],
    nextCursor: null,
  };
  const published = jest.fn().mockResolvedValue(annonces);

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    const moduleRef = await Test.createTestingModule({
      imports: [
        PrismaModule,
        PassportModule,
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
        AnnouncementsModule,
      ],
      providers: [JwtStrategy],
    })
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: userFindUnique } })
      .overrideProvider(AnnouncementsService)
      .useValue({ publieesPourViewer: published })
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
    published.mockClear();
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

  it('refuse un appel anonyme avec 401', async () => {
    await request(app.getHttpServer()).get('/viewer/announcements').expect(401);
    expect(published).not.toHaveBeenCalled();
  });

  it('autorise VIEWER et renvoie la page avec son curseur suivant', async () => {
    await request(app.getHttpServer())
      .get(
        '/viewer/announcements?limit=1000&cursor=eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTIwVDEwOjAwOjAwLjAwMFoiLCJpZCI6ImExIn0',
      )
      .set('Authorization', `Bearer ${await bearerFor('viewer-1')}`)
      .expect(200)
      .expect(annonces);
    expect(published).toHaveBeenCalledTimes(1);
    expect(published).toHaveBeenCalledWith(
      'eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTIwVDEwOjAwOjAwLjAwMFoiLCJpZCI6ImExIn0',
    );
  });

  it('autorise ADMIN authentifié à consulter les annonces publiées', async () => {
    await request(app.getHttpServer())
      .get('/viewer/announcements')
      .set('Authorization', `Bearer ${await bearerFor('admin-1')}`)
      .expect(200)
      .expect(annonces);
    expect(published).toHaveBeenCalledTimes(1);
    expect(published).toHaveBeenCalledWith(undefined);
  });
});
