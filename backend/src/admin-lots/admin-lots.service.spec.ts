import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminLotsService } from './admin-lots.service';

describe('AdminLotsService', () => {
  const prisma = {
    raffleLot: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    raffle: { findUnique: jest.fn() },
    contentAuditEvent: { create: jest.fn() },
  };
  let service: AdminLotsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminLotsService(prisma as never);
  });

  it('refuse la création sur un tirage fermé', async () => {
    prisma.raffle.findUnique.mockResolvedValue({ id: 'r1', statut: 'TIRE' });
    await expect(
      service.creer(
        {
          raffleId: 'r1',
          nom: 'Lot',
          valeurEstimee: '10',
          quantite: 1,
          fournisseur: 'X',
        },
        'a1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuse la suppression d’un lot gagnant', async () => {
    prisma.raffleLot.findUnique.mockResolvedValue({
      id: 'l1',
      nom: 'Lot',
      raffle: { statut: 'OUVERT' },
      _count: { winners: 1 },
    });
    await expect(service.supprimer('l1', 'a1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('signale un lot absent', async () => {
    prisma.raffleLot.findUnique.mockResolvedValue(null);
    await expect(service.detail('absent')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
