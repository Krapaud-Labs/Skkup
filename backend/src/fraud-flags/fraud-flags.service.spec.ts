import { NotFoundException } from '@nestjs/common';
import { FraudFlagStatus } from '../../generated/prisma/enums';
import { FraudFlagsService } from './fraud-flags.service';

describe('FraudFlagsService', () => {
  const prisma = {
    fraudFlag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contentAuditEvent: { create: jest.fn(), findMany: jest.fn() },
  };
  const service = new FraudFlagsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('filtre les signalements par statut', async () => {
    prisma.fraudFlag.findMany.mockResolvedValue([]);
    await expect(service.lister(FraudFlagStatus.OUVERTE)).resolves.toEqual([]);
    expect(prisma.fraudFlag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { statut: FraudFlagStatus.OUVERTE } }),
    );
  });

  it('refuse la mise à jour d un signalement absent', async () => {
    prisma.fraudFlag.findUnique.mockResolvedValue(null);
    await expect(
      service.modifier('absent', { statut: FraudFlagStatus.EXAMINEE }, 'admin'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('masque l email du déclarant dans la liste', async () => {
    prisma.fraudFlag.findMany.mockResolvedValue([{
      id: 'flag-1', user: { id: 'u1', pseudo: 'Ada', email: 'ada@example.test' },
    }]);
    await expect(service.lister()).resolves.toEqual([{
      id: 'flag-1', user: { id: 'u1', pseudo: 'Ada', email: 'ad••@example.test' },
    }]);
  });

  it('ne renvoie pas l email de l acteur dans le détail', async () => {
    prisma.fraudFlag.findUnique.mockResolvedValue({
      id: 'flag-1', user: { id: 'u1', pseudo: 'Ada', email: 'ada@example.test' },
    });
    prisma.contentAuditEvent.findMany.mockResolvedValue([{
      id: 'audit-1', action: 'FRAUD_FLAG_STATUS_UPDATED', metadata: {}, createdAt: new Date(),
      actor: { pseudo: 'Admin' },
    }]);
    const result = await service.detail('flag-1');
    expect(result.user.email).toBe('ad••@example.test');
    expect(result.audit[0].actor).toEqual({ pseudo: 'Admin' });
    expect(result.audit[0].actor).not.toHaveProperty('email');
  });
});
