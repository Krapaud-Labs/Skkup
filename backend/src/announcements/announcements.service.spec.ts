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
});
