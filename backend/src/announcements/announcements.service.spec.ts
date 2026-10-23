/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest matchers use dynamic values in these mocks. */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AnnouncementStatus } from '../../generated/prisma/enums';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsService', () => {
  const tx = {
    announcement: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    contentAuditEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const prisma = {
    announcement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    contentAuditEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
    ),
  };
  const service = new AnnouncementsService(prisma as never);

  const annonce = (status: AnnouncementStatus = 'DRAFT') => ({
    id: 'a1',
    titre: 'Maintenance',
    texte: 'Message',
    status,
    actif: status === 'PUBLISHED',
    debutAt: null,
    finAt: null,
    createdAt: new Date('2026-10-20T10:00:00.000Z'),
  });

  beforeEach(() => jest.clearAllMocks());

  it('garde le contrat public historique actif et temporel', async () => {
    prisma.announcement.findMany.mockResolvedValue([{ id: 'a1' }]);

    await expect(
      service.actives(new Date('2026-08-19T10:00:00Z')),
    ).resolves.toEqual([{ id: 'a1' }]);
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ actif: true, AND: expect.any(Array) }),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });

  it('ne retourne au viewer que les publications, sans filtrer leurs dates', async () => {
    const futureExpired = {
      id: 'published',
      titre: 'À venir',
      texte: 'Annonce publiée, dates sans effet ici',
      createdAt: new Date('2026-10-21T10:00:00.000Z'),
    };
    prisma.announcement.findMany.mockResolvedValue([futureExpired]);

    await expect(service.publieesPourViewer()).resolves.toEqual({
      items: [
        {
          id: 'published',
          titre: 'À venir',
          texte: 'Annonce publiée, dates sans effet ici',
        },
      ],
      nextCursor: null,
    });
    expect(prisma.announcement.findMany).toHaveBeenCalledWith({
      where: { status: AnnouncementStatus.PUBLISHED },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 51,
      select: { id: true, titre: true, texte: true, createdAt: true },
    });
  });

  it('paginates 50 results with a stable createdAt/id cursor', async () => {
    const annonces = Array.from({ length: 51 }, (_, index) => ({
      id: `announcement-${index}`,
      titre: `Title ${index}`,
      texte: `Text ${index}`,
      createdAt: new Date(
        `2026-10-${String(21 - Math.floor(index / 24)).padStart(2, '0')}T10:00:00.000Z`,
      ),
    }));
    prisma.announcement.findMany.mockResolvedValue(annonces);

    const result = await service.publieesPourViewer();
    expect(result.items).toHaveLength(50);
    expect(result.nextCursor).toBeTruthy();
    const cursor = JSON.parse(
      Buffer.from(result.nextCursor!, 'base64url').toString('utf8'),
    ) as { createdAt: string; id: string };
    expect(cursor).toEqual({
      createdAt: annonces[49].createdAt.toISOString(),
      id: annonces[49].id,
    });
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 51 }),
    );
  });

  it('rejects an invalid viewer cursor before querying the database', async () => {
    await expect(
      service.publieesPourViewer('not-a-cursor'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.announcement.findMany).not.toHaveBeenCalled();
  });

  it('creates drafts and records creation atomically', async () => {
    const created = annonce('DRAFT');
    tx.announcement.create.mockResolvedValue(created);

    await expect(
      service.creer({ titre: 'Maintenance', texte: 'Message' }, 'admin-1'),
    ).resolves.toEqual(created);
    expect(tx.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT', actif: false }),
      }),
    );
    expect(tx.contentAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'ANNOUNCEMENT_CREATED' }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects an inverted publication window on create', async () => {
    await expect(
      service.creer(
        {
          titre: 'Maintenance',
          texte: 'Message',
          debutAt: '2026-08-20T10:00:00Z',
          finAt: '2026-08-19T10:00:00Z',
        },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('publishes a draft once, updating the compatibility alias and audit atomically', async () => {
    tx.announcement.findUnique
      .mockResolvedValueOnce(annonce('DRAFT'))
      .mockResolvedValueOnce(annonce('PUBLISHED'));
    tx.announcement.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.publier('a1', 'admin-1')).resolves.toMatchObject({
      status: 'PUBLISHED',
      actif: true,
    });
    expect(tx.announcement.updateMany).toHaveBeenCalledWith({
      where: { id: 'a1', status: 'DRAFT' },
      data: { status: 'PUBLISHED', actif: true },
    });
    expect(tx.contentAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ANNOUNCEMENT_PUBLISHED',
          metadata: expect.objectContaining({
            previous: expect.objectContaining({ status: 'DRAFT' }),
            current: expect.objectContaining({ status: 'PUBLISHED' }),
          }),
        }),
      }),
    );
  });

  it('makes repeated publish idempotent without an extra audit event', async () => {
    tx.announcement.findUnique.mockResolvedValue(annonce('PUBLISHED'));

    await expect(service.publier('a1', 'admin-1')).resolves.toMatchObject({
      status: 'PUBLISHED',
    });
    expect(tx.announcement.updateMany).not.toHaveBeenCalled();
    expect(tx.contentAuditEvent.create).not.toHaveBeenCalled();
  });

  it('returns conflict when a transition loses a concurrent status race', async () => {
    tx.announcement.findUnique
      .mockResolvedValueOnce(annonce('DRAFT'))
      .mockResolvedValueOnce(annonce('ARCHIVED'));
    tx.announcement.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.publier('a1', 'admin-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.contentAuditEvent.create).not.toHaveBeenCalled();
  });

  it('archives with a complete previous snapshot and keeps the record', async () => {
    tx.announcement.findUnique
      .mockResolvedValueOnce(annonce('PUBLISHED'))
      .mockResolvedValueOnce(annonce('ARCHIVED'));
    tx.announcement.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.supprimer('a1', 'admin-1')).resolves.toMatchObject({
      status: 'ARCHIVED',
      actif: false,
    });
    expect(tx.announcement.updateMany).toHaveBeenCalledWith({
      where: { id: 'a1', status: 'PUBLISHED' },
      data: { status: 'ARCHIVED', actif: false },
    });
    expect(tx.contentAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ANNOUNCEMENT_ARCHIVED',
          metadata: expect.objectContaining({
            previous: expect.objectContaining({ status: 'PUBLISHED' }),
          }),
        }),
      }),
    );
  });

  it('makes repeated archive idempotent without a duplicate event', async () => {
    tx.announcement.findUnique.mockResolvedValue(annonce('ARCHIVED'));

    await expect(service.supprimer('a1', 'admin-1')).resolves.toMatchObject({
      status: 'ARCHIVED',
    });
    expect(tx.announcement.updateMany).not.toHaveBeenCalled();
    expect(tx.contentAuditEvent.create).not.toHaveBeenCalled();
  });

  it('refuses edits to archived announcements', async () => {
    tx.announcement.findUnique.mockResolvedValue(annonce('ARCHIVED'));

    await expect(
      service.modifier('a1', { titre: 'Change' }, 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.announcement.updateMany).not.toHaveBeenCalled();
  });

  it('translates the legacy actif patch into the published state', async () => {
    tx.announcement.findUnique
      .mockResolvedValueOnce(annonce('DRAFT'))
      .mockResolvedValueOnce(annonce('PUBLISHED'));
    tx.announcement.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.modifier('a1', { actif: true }, 'admin-1'),
    ).resolves.toMatchObject({ status: 'PUBLISHED', actif: true });
    expect(tx.announcement.updateMany).toHaveBeenCalledWith({
      where: { id: 'a1', status: 'DRAFT' },
      data: expect.objectContaining({ status: 'PUBLISHED', actif: true }),
    });
    expect(tx.contentAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'ANNOUNCEMENT_PUBLISHED' }),
      }),
    );
  });

  it('restores only an archive event to the previous state atomically', async () => {
    const archived = annonce('ARCHIVED');
    const restored = annonce('PUBLISHED');
    tx.announcement.findUnique
      .mockResolvedValueOnce(archived)
      .mockResolvedValueOnce(restored);
    tx.contentAuditEvent.findFirst
      .mockResolvedValueOnce({
        id: 'archive-1',
        action: 'ANNOUNCEMENT_ARCHIVED',
        metadata: {
          previous: {
            titre: 'Maintenance',
            texte: 'Message',
            debutAt: null,
            finAt: null,
            status: 'PUBLISHED',
          },
        },
      })
      .mockResolvedValueOnce(null);
    tx.announcement.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.restaurer('a1', 'archive-1', 'admin-1'),
    ).resolves.toMatchObject({ status: 'PUBLISHED', actif: true });
    expect(tx.announcement.updateMany).toHaveBeenCalledWith({
      where: { id: 'a1', status: 'ARCHIVED' },
      data: expect.objectContaining({ status: 'PUBLISHED', actif: true }),
    });
    expect(tx.contentAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ANNOUNCEMENT_RESTORED',
          metadata: expect.objectContaining({ sourceEventId: 'archive-1' }),
        }),
      }),
    );
  });

  it('makes a repeated restore idempotent while its snapshot remains current', async () => {
    const current = annonce('PUBLISHED');
    tx.announcement.findUnique.mockResolvedValue(current);
    tx.contentAuditEvent.findFirst
      .mockResolvedValueOnce({
        id: 'archive-1',
        action: 'ANNOUNCEMENT_ARCHIVED',
        metadata: {
          previous: {
            titre: 'Maintenance',
            texte: 'Message',
            debutAt: null,
            finAt: null,
            status: 'PUBLISHED',
          },
        },
      })
      .mockResolvedValueOnce({ id: 'restore-1' });

    await expect(
      service.restaurer('a1', 'archive-1', 'admin-1'),
    ).resolves.toEqual(current);
    expect(tx.announcement.updateMany).not.toHaveBeenCalled();
    expect(tx.contentAuditEvent.create).not.toHaveBeenCalled();
  });

  it.each([
    { previousActiveState: true, expectedStatus: 'PUBLISHED' },
    { previousActiveState: false, expectedStatus: 'DRAFT' },
    { previousActiveState: undefined, expectedStatus: 'DRAFT' },
  ] as const)(
    'restores an old archive with previousActiveState=$previousActiveState as $expectedStatus',
    async ({ previousActiveState, expectedStatus }) => {
      const current = annonce('ARCHIVED');
      tx.announcement.findUnique
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(annonce(expectedStatus));
      tx.contentAuditEvent.findFirst
        .mockResolvedValueOnce({
          id: 'legacy-archive',
          action: 'ANNOUNCEMENT_ARCHIVED',
          metadata: {
            titre: 'Old',
            ...(previousActiveState === undefined
              ? {}
              : { previousActiveState }),
          },
        })
        .mockResolvedValueOnce(null);
      tx.announcement.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.restaurer('a1', 'legacy-archive', 'admin-1'),
      ).resolves.toMatchObject({ status: expectedStatus });
      expect(tx.announcement.updateMany).toHaveBeenCalledWith({
        where: { id: 'a1', status: 'ARCHIVED' },
        data: expect.objectContaining({
          status: expectedStatus,
          actif: expectedStatus === 'PUBLISHED',
        }),
      });
    },
  );

  it('rejects a repeated restore if a later change makes the old snapshot stale', async () => {
    tx.announcement.findUnique.mockResolvedValue({
      ...annonce('PUBLISHED'),
      titre: 'Changed later',
    });
    tx.contentAuditEvent.findFirst
      .mockResolvedValueOnce({
        id: 'archive-1',
        action: 'ANNOUNCEMENT_ARCHIVED',
        metadata: {
          previous: {
            titre: 'Maintenance',
            texte: 'Message',
            debutAt: null,
            finAt: null,
            status: 'PUBLISHED',
          },
        },
      })
      .mockResolvedValueOnce({ id: 'restore-1' });

    await expect(
      service.restaurer('a1', 'archive-1', 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.announcement.updateMany).not.toHaveBeenCalled();
  });

  it('rejects restoring an event that is not an archive', async () => {
    tx.announcement.findUnique.mockResolvedValue(annonce('ARCHIVED'));
    tx.contentAuditEvent.findFirst
      .mockResolvedValueOnce({ id: 'update-1', action: 'ANNOUNCEMENT_UPDATED' })
      .mockResolvedValueOnce(null);

    await expect(
      service.restaurer('a1', 'update-1', 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.announcement.updateMany).not.toHaveBeenCalled();
  });

  it('returns not found for an absent announcement', async () => {
    tx.announcement.findUnique.mockResolvedValue(null);

    await expect(service.publier('missing', 'admin-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
