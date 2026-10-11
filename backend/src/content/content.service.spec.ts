import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';

describe('ContentService', () => {
  const prisma = {
    managedContent: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    contentVersion: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    contentAuditEvent: { create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new ContentService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('refuse un doublon de contenu', async () => {
    prisma.managedContent.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.creer(
        { slug: 'home', type: 'LANDING', locale: 'fr', data: {} },
        'admin',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse la modification d un contenu absent', async () => {
    prisma.managedContent.findUnique.mockResolvedValue(null);
    await expect(
      service.modifier('missing', { data: {} }, 'admin'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('expose uniquement une version publiée côté public', async () => {
    prisma.managedContent.findFirst.mockResolvedValue({
      id: 'published',
      status: 'PUBLISHED',
    });
    await expect(service.publier('home', 'LANDING', 'fr')).resolves.toEqual({
      id: 'published',
      status: 'PUBLISHED',
    });
    expect(prisma.managedContent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'home',
          type: 'LANDING',
          locale: 'fr',
          status: 'PUBLISHED',
        },
      }),
    );
  });

  it('dépublie un contenu en conservant sa version', async () => {
    prisma.managedContent.findUnique.mockResolvedValue({
      id: 'content-1',
      version: 2,
      status: 'PUBLISHED',
    });
    prisma.managedContent.update.mockResolvedValue({
      id: 'content-1',
      status: 'DRAFT',
      publishedAt: null,
    });

    await expect(
      service.depublier('content-1', 'admin'),
    ).resolves.toMatchObject({
      id: 'content-1',
      status: 'DRAFT',
    });
    expect(prisma.contentAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ action: 'CONTENT_UNPUBLISHED' }),
      }),
    );
  });

  it('restaure une version comme nouveau brouillon', async () => {
    prisma.contentVersion.findFirst.mockResolvedValue({
      id: 'version-1',
      contentId: 'content-1',
      data: { title: 'Ancien titre' },
    });
    prisma.managedContent.findUnique.mockResolvedValue({
      id: 'content-1',
      version: 2,
    });
    prisma.managedContent.update.mockResolvedValue({
      id: 'content-1',
      version: 3,
      status: 'DRAFT',
      data: { title: 'Ancien titre' },
    });
    prisma.$transaction.mockImplementation(
      (operation: (tx: typeof prisma) => unknown) => operation(prisma),
    );

    await expect(
      service.restaurer('content-1', 'version-1', 'admin'),
    ).resolves.toMatchObject({
      id: 'content-1',
      version: 3,
      status: 'DRAFT',
    });
    expect(prisma.contentVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ version: 3 }),
      }),
    );
  });
});
