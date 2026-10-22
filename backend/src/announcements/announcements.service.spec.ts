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
    const createdAtFuture = new Date('2026-10-21T10:00:00.000Z');
    const createdAtExpired = new Date('2026-10-20T10:00:00.000Z');
    const annonceFuture = {
      id: 'future',
      titre: 'À venir',
      texte: 'Annonce planifiée',
      actif: true,
      createdAt: createdAtFuture,
      debutAt: new Date('2026-10-21T10:00:00Z'),
      finAt: new Date('2026-10-22T10:00:00Z'),
    };
    const annonceExpiree = {
      id: 'expired',
      titre: 'Terminée',
      texte: 'Annonce expirée',
      actif: true,
      createdAt: createdAtExpired,
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
      annonceFuture,
      annonceExpiree,
    ]);

    const annoncesRetournees = await service.publieesPourViewer();
    expect(annoncesRetournees).toEqual({
      items: [champsPublies(annonceFuture), champsPublies(annonceExpiree)],
      nextCursor: null,
    });
    expect(annoncesRetournees.items.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining([annonceInactive.id, annonceArchivee.id]),
    );
    expect(prisma.announcement.findMany).toHaveBeenCalledWith({
      where: { actif: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 51,
      select: { id: true, titre: true, texte: true, createdAt: true },
    });
  });

  it('borne à 50 éléments et construit un curseur stable sur createdAt et id', async () => {
    const annonces = Array.from({ length: 51 }, (_, index) => ({
      id: `annonce-${index}`,
      titre: `Titre ${index}`,
      texte: `Texte ${index}`,
      createdAt: new Date(
        `2026-10-${String(21 - Math.floor(index / 24)).padStart(2, '0')}T10:00:00.000Z`,
      ),
    }));
    prisma.announcement.findMany.mockResolvedValue(annonces);

    const resultat = await service.publieesPourViewer();

    expect(resultat.items).toHaveLength(50);
    expect(resultat.items[0]).toEqual({
      id: 'annonce-0',
      titre: 'Titre 0',
      texte: 'Texte 0',
    });
    expect(resultat.nextCursor).toBeTruthy();
    const position = JSON.parse(
      Buffer.from(resultat.nextCursor!, 'base64url').toString('utf8'),
    ) as { createdAt: string; id: string };
    expect(position).toEqual({
      createdAt: annonces[49].createdAt.toISOString(),
      id: annonces[49].id,
    });
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 51 }),
    );
  });

  it('reprend strictement après le couple createdAt/id du curseur', async () => {
    const createdAt = new Date('2026-10-20T10:00:00.000Z');
    const cursor = Buffer.from(
      JSON.stringify({ createdAt: createdAt.toISOString(), id: 'annonce-50' }),
    ).toString('base64url');
    prisma.announcement.findMany.mockResolvedValue([]);

    await expect(service.publieesPourViewer(cursor)).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
    expect(prisma.announcement.findMany).toHaveBeenCalledWith({
      where: {
        actif: true,
        OR: [
          { createdAt: { lt: createdAt } },
          { createdAt, id: { lt: 'annonce-50' } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 51,
      select: { id: true, titre: true, texte: true, createdAt: true },
    });
  });

  it('rejette un curseur invalide sans requête base de données', async () => {
    await expect(
      service.publieesPourViewer('not-a-cursor'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.announcement.findMany).not.toHaveBeenCalled();
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
