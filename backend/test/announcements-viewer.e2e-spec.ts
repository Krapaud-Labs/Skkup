import { INestApplication, ValidationPipe } from '@nestjs/common';
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

describe('viewer announcements (HTTP integration)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const userFindUnique = jest.fn();
  const authSessionFindUnique = jest.fn();
  const annonces = {
    items: [{ id: 'annonce-1', titre: 'Info', texte: 'Texte brut' }],
    nextCursor: null,
  };
  const published = jest.fn().mockResolvedValue(annonces);
  const compterNonLues = jest.fn().mockResolvedValue({
    publishedCount: 2,
    readPublishedCount: 1,
    publishedSetFingerprint: 'a'.repeat(64),
  });

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
      .useValue({
        user: { findUnique: userFindUnique },
        authSession: { findUnique: authSessionFindUnique },
      })
      .overrideProvider(AnnouncementsService)
      .useValue({
        publieesPourViewer: published,
        compterNonLuesPourViewer: compterNonLues,
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  beforeEach(() => {
    authSessionFindUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        const userId = where.id.replace(/^test-session-/, '');
        return Promise.resolve({
          userId,
          sessionVersion: 0,
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60 * 60_000),
          user: {
            email: `${userId}@example.test`,
            sessionVersion: 0,
            actif: true,
          },
        });
      },
    );
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
    compterNonLues.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  async function bearerFor(sub: string): Promise<string> {
    return jwt.signAsync({
      sub,
      email: `${sub}@example.test`,
      sid: `test-session-${sub}`,
      sessionVersion: 0,
      jourConnexion: jourConnexion(),
    });
  }

  it('refuse un appel anonyme avec 401', async () => {
    await request(app.getHttpServer()).get('/viewer/announcements').expect(401);
    expect(published).not.toHaveBeenCalled();
  });

  it('compte les publications non lues pour une session authentifiée', async () => {
    const readIds = ['announcement-1'];
    await request(app.getHttpServer())
      .post('/viewer/announcements/unread-count')
      .set('Authorization', `Bearer ${await bearerFor('viewer-1')}`)
      .send({ readIds })
      .expect(201)
      .expect({
        publishedCount: 2,
        readPublishedCount: 1,
        publishedSetFingerprint: 'a'.repeat(64),
      });
    expect(compterNonLues).toHaveBeenCalledWith(readIds);
  });

  it('autorise ADMIN authentifié à compter les annonces viewer', async () => {
    const readIds = ['announcement-1'];
    await request(app.getHttpServer())
      .post('/viewer/announcements/unread-count')
      .set('Authorization', `Bearer ${await bearerFor('admin-1')}`)
      .send({ readIds })
      .expect(201);
    expect(compterNonLues).toHaveBeenCalledWith(readIds);
  });

  it('refuse le comptage anonyme avec 401', async () => {
    await request(app.getHttpServer())
      .post('/viewer/announcements/unread-count')
      .send({ readIds: [] })
      .expect(401);
    expect(compterNonLues).not.toHaveBeenCalled();
  });

  it('rejette les IDs dupliqués dans la requête de comptage', async () => {
    await request(app.getHttpServer())
      .post('/viewer/announcements/unread-count')
      .set('Authorization', `Bearer ${await bearerFor('viewer-1')}`)
      .send({ readIds: ['announcement-1', 'announcement-1'] })
      .expect(400);
    expect(compterNonLues).not.toHaveBeenCalled();
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
