import { ConflictException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    contentAuditEvent: { create: jest.fn() },
  };
  let service: AdminUsersService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminUsersService(prisma as never);
  });

  it('empêche un administrateur de désactiver sa propre session', async () => {
    await expect(
      service.modifierStatut('a1', { actif: false }, 'a1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('invalide les sessions lors d’une désactivation et audite l’action', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'VIEWER',
      actif: true,
    });
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      pseudo: 'User',
      role: 'VIEWER',
      actif: false,
    });
    const result = await service.modifierStatut('u1', { actif: false }, 'a1');
    expect(result.actif).toBe(false);
    const updateCall = prisma.user.update.mock.calls[0] as unknown as [
      { data: { actif: boolean; sessionVersion: { increment: number } } },
    ];
    expect(updateCall[0].data).toEqual({
      actif: false,
      sessionVersion: { increment: 1 },
    });
    expect(prisma.contentAuditEvent.create).toHaveBeenCalled();
  });

  it('ne renvoie jamais l email brut dans la liste', async () => {
    prisma.user.findMany.mockResolvedValue([{
      id: 'u1', pseudo: 'Ada', email: 'ada.lovelace@example.test', role: 'VIEWER', actif: true,
      soldePoints: 12, streakActuel: 2, createdAt: new Date('2026-01-01'),
      _count: { raffleTickets: 1, watchSessions: 2 },
    }]);
    const result = await service.lister('ada.lovelace');
    expect(result[0].email).not.toBe('ada.lovelace@example.test');
    expect(result[0].email).toContain('@example.test');
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ pseudo: { contains: 'ada.lovelace', mode: 'insensitive' } }, { email: { contains: 'ada.lovelace', mode: 'insensitive' } }] },
    }));
  });

  it('masque l email du détail', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', pseudo: 'Ada', email: 'ada@example.test', role: 'VIEWER', actif: true,
      soldePoints: 12, streakActuel: 2, streakMax: 4, derniereVisiteAt: null,
      createdAt: new Date('2026-01-01'), _count: { raffleTickets: 1, watchSessions: 2, pointsTransactions: 3 },
    });
    const result = await service.detail('u1');
    expect(result.email).toBe('ad••@example.test');
  });
});
