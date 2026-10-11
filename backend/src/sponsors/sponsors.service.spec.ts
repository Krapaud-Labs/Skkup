import { NotFoundException } from '@nestjs/common';
import { SponsorsService } from './sponsors.service';

describe('SponsorsService', () => {
  const prisma = {
    sponsor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    contentAuditEvent: { create: jest.fn() },
  };
  const service = new SponsorsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('liste les sponsors et le nombre de lots associés', async () => {
    prisma.sponsor.findMany.mockResolvedValue([
      { id: 's1', _count: { lots: 2 } },
    ]);
    await expect(service.lister()).resolves.toEqual([
      { id: 's1', _count: { lots: 2 } },
    ]);
  });

  it('refuse la modification d un sponsor absent', async () => {
    prisma.sponsor.findUnique.mockResolvedValue(null);
    await expect(
      service.modifier('absent', { actif: false }, 'admin'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
