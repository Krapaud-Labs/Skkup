import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionRevocationService } from './session-revocation.service';

describe('AuthService.changerMotDePasse', () => {
  const ancien = 'AncienMotDePasse1';
  const nouveau = 'NouveauMotDePasse2';
  let service: AuthService;
  interface PrismaMock {
    user: { findUnique: jest.Mock; update: jest.Mock };
    extensionPairing: { updateMany: jest.Mock };
    extensionPairingToken: { deleteMany: jest.Mock };
    watchSession: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  }
  let prisma: PrismaMock;
  let revocation: SessionRevocationService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      extensionPairing: { updateMany: jest.fn() },
      extensionPairingToken: { deleteMany: jest.fn() },
      watchSession: { updateMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    revocation = new SessionRevocationService();
    service = new AuthService(
      prisma as unknown as PrismaService,
      { sign: jest.fn() } as unknown as JwtService,
      revocation,
    );
  });

  it('refuse un ancien mot de passe incorrect sans modifier le compte', async () => {
    prisma.user.findUnique.mockResolvedValue({
      passwordHash: await bcrypt.hash(ancien, 4),
    });

    await expect(
      service.changerMotDePasse('user-1', {
        ancienMotDePasse: 'mauvais',
        nouveauMotDePasse: nouveau,
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejette le nouveau mot de passe identique', async () => {
    prisma.user.findUnique.mockResolvedValue({
      passwordHash: await bcrypt.hash(ancien, 4),
    });

    await expect(
      service.changerMotDePasse('user-1', {
        ancienMotDePasse: ancien,
        nouveauMotDePasse: ancien,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('met à jour le mot de passe et révoque tous les accès dans une transaction', async () => {
    prisma.user.findUnique.mockResolvedValue({
      passwordHash: await bcrypt.hash(ancien, 4),
    });

    const notifier = jest.spyOn(revocation, 'revoquer');
    await service.changerMotDePasse('user-1', {
      ancienMotDePasse: ancien,
      nouveauMotDePasse: nouveau,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: expect.any(String) as unknown,
        sessionVersion: { increment: 1 },
      },
    });
    expect(prisma.extensionPairing.updateMany).toHaveBeenCalled();
    expect(prisma.extensionPairingToken.deleteMany).toHaveBeenCalled();
    expect(prisma.watchSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', statut: 'EN_COURS' },
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(notifier).toHaveBeenCalledWith('user-1');
    const appel = prisma.user.update.mock.calls[0] as unknown as [
      { data: { passwordHash: string } },
    ];
    expect(await bcrypt.compare(nouveau, appel[0].data.passwordHash)).toBe(
      true,
    );
  });
});
