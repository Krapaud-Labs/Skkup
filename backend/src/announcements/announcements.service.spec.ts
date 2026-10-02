import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsService', () => {
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
  };
  const service = new AnnouncementsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('retourne les annonces actives avec une fenêtre valide', async () => {
    prisma.announcement.findMany.mockResolvedValue([{ id: 'a1' }]);

    await expect(
      service.actives(new Date('2026-08-19T10:00:00Z')),
    ).resolves.toEqual([{ id: 'a1' }]);
    expect(prisma.announcement.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });

  it('rejette une période inversée à la création', async () => {
    await expect(
      service.creer(
        {
          titre: 'Maintenance',
          texte: 'Indisponibilité temporaire',
          debutAt: '2026-08-20T10:00:00Z',
          finAt: '2026-08-19T10:00:00Z',
        },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.announcement.create).not.toHaveBeenCalled();
  });

  it('refuse la modification d une annonce absente', async () => {
    prisma.announcement.findUnique.mockResolvedValue(null);

    await expect(
      service.modifier('absente', { actif: false }, 'admin-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('restaure une version historisée sans supprimer l annonce', async () => {
    prisma.announcement.findUnique
      .mockResolvedValueOnce({ id: 'a1', titre: 'Actuel', texte: 'Actuel' })
      .mockResolvedValueOnce({ id: 'a1', titre: 'Ancien', texte: 'Ancien' });
    prisma.contentAuditEvent.findFirst.mockResolvedValue({
      id: 'event-1',
      metadata: { previous: { titre: 'Ancien', texte: 'Ancien', actif: true } },
    });
    prisma.announcement.update.mockResolvedValue({
      id: 'a1',
      titre: 'Ancien',
      texte: 'Ancien',
    });

    await expect(
      service.restaurer('a1', 'event-1', 'admin-1'),
    ).resolves.toEqual({
      id: 'a1',
      titre: 'Ancien',
      texte: 'Ancien',
    });
    expect(prisma.announcement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'a1' },
        // Jest's asymmetric matcher is intentionally untyped here.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          titre: 'Ancien',
          texte: 'Ancien',
          actif: true,
        }),
      }),
    );
    expect(prisma.contentAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ action: 'ANNOUNCEMENT_RESTORED' }),
      }),
    );
  });
});
