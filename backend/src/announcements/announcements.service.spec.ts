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

  it('retourne les annonces actives futures et expirées, sans les inactives ou archivées', async () => {
    const annonceFuture = {
      id: 'future',
      titre: 'À venir',
      texte: 'Annonce planifiée',
      actif: true,
      debutAt: new Date('2026-10-21T10:00:00Z'),
      finAt: new Date('2026-10-22T10:00:00Z'),
    };
    const annonceExpiree = {
      id: 'expired',
      titre: 'Terminée',
      texte: 'Annonce expirée',
      actif: true,
      debutAt: new Date('2026-10-18T10:00:00Z'),
      finAt: new Date('2026-10-19T10:00:00Z'),
    };
    const annonceInactive = {
      id: 'inactive',
      titre: 'Inactive',
      texte: 'Annonce désactivée',
      actif: false,
    };
    const annonceArchivee = {
      id: 'archived',
      titre: 'Archivée',
      texte: 'Annonce archivée',
      actif: false,
    };
    const champsPublies = ({ id, titre, texte }: typeof annonceFuture) => ({
      id,
      titre,
      texte,
    });
    prisma.announcement.findMany.mockResolvedValue([
      champsPublies(annonceFuture),
      champsPublies(annonceExpiree),
    ]);

    const annoncesRetournees = await service.publieesPourViewer();
    expect(annoncesRetournees).toEqual([
      champsPublies(annonceFuture),
      champsPublies(annonceExpiree),
    ]);
    expect(annoncesRetournees.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining([annonceInactive.id, annonceArchivee.id]),
    );
    expect(prisma.announcement.findMany).toHaveBeenCalledWith({
      where: { actif: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, titre: true, texte: true },
    });
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

  it('archive une annonce sans la supprimer de l historique', async () => {
    prisma.announcement.findUnique.mockResolvedValue({
      id: 'a1',
      titre: 'Maintenance',
      texte: 'Message',
      actif: true,
    });
    prisma.announcement.update.mockResolvedValue({
      id: 'a1',
      titre: 'Maintenance',
      texte: 'Message',
      actif: false,
    });

    await expect(service.supprimer('a1', 'admin-1')).resolves.toMatchObject({
      id: 'a1',
      actif: false,
    });
    expect(prisma.announcement.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { actif: false },
    });
    expect(prisma.contentAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ action: 'ANNOUNCEMENT_ARCHIVED' }),
      }),
    );
  });
});
