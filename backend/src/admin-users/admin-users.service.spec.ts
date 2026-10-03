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
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actif: false,
          sessionVersion: { increment: 1 },
        }),
      }),
    );
    expect(prisma.contentAuditEvent.create).toHaveBeenCalled();
  });
});
