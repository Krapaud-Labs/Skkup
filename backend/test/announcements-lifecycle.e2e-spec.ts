import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AnnouncementsModule } from '../src/announcements/announcements.module';
import { AnnouncementsService } from '../src/announcements/announcements.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { jourConnexion } from '../src/auth/cookie-session';

const JWT_SECRET = 'announcement-lifecycle-e2e-only-secret';

type AnnouncementResponse = { id: string; status: string; actif: boolean };
type ViewerPage = {
  items: Array<{ id: string; titre: string; texte: string }>;
};
type AnnouncementAuditEvent = {
  id: string;
  action: string;
  actorId: string;
  metadata: {
    previous?: { status?: string };
    sourceEventId?: string;
  };
};

function assertSafeE2eDatabase(databaseUrl: string | undefined): void {
  if (process.env.ANNOUNCEMENT_E2E_ALLOW_DATABASE !== '1') {
    throw new Error(
      'Set ANNOUNCEMENT_E2E_ALLOW_DATABASE=1 only for an isolated test database.',
    );
  }
  if (!databaseUrl)
    throw new Error('DATABASE_URL is required for this E2E test.');

  const url = new URL(databaseUrl);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const safeName = /(?:^|[_-])(?:test|qa)(?:[_-]|$)/i.test(databaseName);
  const safeHost = ['localhost', '127.0.0.1', '::1', 'postgres'].includes(
    url.hostname.toLowerCase(),
  );
  if (!safeName || !safeHost) {
    throw new Error(
      `Refusing announcement lifecycle E2E against ${url.hostname}/${databaseName}; use a local database named *_test or *_qa.`,
    );
  }
}

describe('announcement lifecycle (PostgreSQL integration)', () => {
  const runId = randomUUID();
  const adminId = `announcement-e2e-admin-${runId}`;
  const viewerId = `announcement-e2e-viewer-${runId}`;
  const emailSuffix = `${runId}@example.test`;
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
        AnnouncementsModule,
      ],
      providers: [JwtStrategy],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);

    await prisma.user.createMany({
      data: [
        {
          id: adminId,
          email: `admin-${emailSuffix}`,
          passwordHash: 'not-a-real-password-hash',
          pseudo: `e2e-admin-${runId}`,
          role: 'ADMIN',
        },
        {
          id: viewerId,
          email: `viewer-${emailSuffix}`,
          passwordHash: 'not-a-real-password-hash',
          pseudo: `e2e-viewer-${runId}`,
          role: 'VIEWER',
        },
      ],
    });
  }, 30_000);

  afterAll(async () => {
    try {
      if (prisma) {
        const announcements = await prisma.announcement.findMany({
          where: { createdById: adminId },
          select: { id: true },
        });
        const announcementIds = announcements.map(({ id }) => id);
        if (announcementIds.length > 0) {
          await prisma.contentAuditEvent.deleteMany({
            where: {
              entityType: 'Announcement',
              entityId: { in: announcementIds },
            },
          });
          await prisma.announcement.deleteMany({
            where: { id: { in: announcementIds } },
          });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [adminId, viewerId] } },
        });
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

  it('rejects viewer JWTs on all admin mutations before the business service', async () => {
    const service = app.get(AnnouncementsService);
    const shouldNotRun = () =>
      Promise.reject(new Error('Admin business service must not be called.'));
    const serviceCalls = [
      jest.spyOn(service, 'creer').mockImplementation(shouldNotRun),
      jest.spyOn(service, 'modifier').mockImplementation(shouldNotRun),
      jest.spyOn(service, 'publier').mockImplementation(shouldNotRun),
      jest.spyOn(service, 'supprimer').mockImplementation(shouldNotRun),
      jest.spyOn(service, 'restaurer').mockImplementation(shouldNotRun),
    ];
    const viewerToken = await bearerFor(viewerId, `viewer-${emailSuffix}`);
    const http = request(app.getHttpServer());
    const headers = { Authorization: `Bearer ${viewerToken}` };
    const announcementId = 'admin-only-announcement';
    const archiveEventId = 'admin-only-archive-event';

    try {
      await http
        .post('/admin/announcements')
        .set(headers)
        .send({ titre: 'Forbidden', texte: 'Viewer cannot create.' })
        .expect(403);
      await http
        .patch(`/admin/announcements/${announcementId}`)
        .set(headers)
        .send({ titre: 'Forbidden edit' })
        .expect(403);
      await http
        .post(`/admin/announcements/${announcementId}/publish`)
        .set(headers)
        .expect(403);
      await http
        .delete(`/admin/announcements/${announcementId}`)
        .set(headers)
        .expect(403);
      await http
        .post(
          `/admin/announcements/${announcementId}/restore/${archiveEventId}`,
        )
        .set(headers)
        .expect(403);

      for (const call of serviceCalls) {
        expect(call).not.toHaveBeenCalled();
      }
    } finally {
      jest.restoreAllMocks();
    }
  }, 30_000);

  it('persists draft, publish, archive, restore, viewer visibility and audit history', async () => {
    const adminEmail = `admin-${emailSuffix}`;
    const viewerEmail = `viewer-${emailSuffix}`;
    const adminToken = await bearerFor(adminId, adminEmail);
    const viewerToken = await bearerFor(viewerId, viewerEmail);
    const http = request(app.getHttpServer());

    const created = await http
      .post('/admin/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ titre: 'Lifecycle E2E', texte: 'Persisted PostgreSQL content.' })
      .expect(201);
    const createdBody = created.body as unknown as AnnouncementResponse;
    const announcementId = createdBody.id;
    expect(createdBody).toMatchObject({ status: 'DRAFT', actif: false });

    const draft = await prisma.announcement.findUniqueOrThrow({
      where: { id: announcementId },
    });
    expect(draft).toMatchObject({
      status: 'DRAFT',
      actif: false,
      createdById: adminId,
    });
    const viewerDraft = await http
      .get('/viewer/announcements')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);
    const viewerDraftPage = viewerDraft.body as unknown as ViewerPage;
    expect(viewerDraftPage.items).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: announcementId })]),
    );

    const published = await http
      .post(`/admin/announcements/${announcementId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(published.body as unknown as AnnouncementResponse).toMatchObject({
      status: 'PUBLISHED',
      actif: true,
    });
    const viewerPublished = await http
      .get('/viewer/announcements')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);
    const viewerPublishedPage = viewerPublished.body as unknown as ViewerPage;
    expect(viewerPublishedPage.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: announcementId })]),
    );

    const archived = await http
      .delete(`/admin/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(archived.body as unknown as AnnouncementResponse).toMatchObject({
      status: 'ARCHIVED',
      actif: false,
    });
    const viewerArchived = await http
      .get('/viewer/announcements')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);
    const viewerArchivedPage = viewerArchived.body as unknown as ViewerPage;
    expect(viewerArchivedPage.items).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: announcementId })]),
    );

    const history = await http
      .get(`/admin/announcements/${announcementId}/history`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const historyEvents = history.body as unknown as AnnouncementAuditEvent[];
    const archiveEvent = historyEvents.find(
      (event) => event.action === 'ANNOUNCEMENT_ARCHIVED',
    );
    if (!archiveEvent)
      throw new Error('Archive audit event was not persisted.');
    expect(archiveEvent.metadata.previous?.status).toBe('PUBLISHED');

    const restoredResponse = await http
      .post(`/admin/announcements/${announcementId}/restore/${archiveEvent.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(
      restoredResponse.body as unknown as AnnouncementResponse,
    ).toMatchObject({ status: 'PUBLISHED', actif: true });

    const [restored, viewerRestored, audit] = await Promise.all([
      prisma.announcement.findUniqueOrThrow({ where: { id: announcementId } }),
      http
        .get('/viewer/announcements')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200),
      prisma.contentAuditEvent.findMany({
        where: { entityType: 'Announcement', entityId: announcementId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    expect(restored).toMatchObject({ status: 'PUBLISHED', actif: true });
    const viewerRestoredPage = viewerRestored.body as unknown as ViewerPage;
    expect(viewerRestoredPage.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: announcementId })]),
    );
    expect(audit.map((event) => event.action).sort()).toEqual(
      [
        'ANNOUNCEMENT_CREATED',
        'ANNOUNCEMENT_PUBLISHED',
        'ANNOUNCEMENT_ARCHIVED',
        'ANNOUNCEMENT_RESTORED',
      ].sort(),
    );
    expect(audit).toHaveLength(4);
    expect(audit[3].metadata).toMatchObject({ sourceEventId: archiveEvent.id });
    expect(audit.every((event) => event.actorId === adminId)).toBe(true);
  }, 30_000);
});
