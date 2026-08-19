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
      service.modifier('absent', { statut: FraudFlagStatus.EXAMINEE }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
