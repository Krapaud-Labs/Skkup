import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ViewerGuard } from './viewer.guard';
import type { PrismaService } from '../../prisma/prisma.service';

describe('ViewerGuard', () => {
  let guard: ViewerGuard;
  let findUnique: jest.Mock;
  let superCanActivate: jest.SpyInstance;
  let request: { user?: { userId: string } };

  const context = () =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    request = { user: { userId: 'user-1' } };
    findUnique = jest.fn();
    guard = new ViewerGuard({
      user: { findUnique },
    } as unknown as PrismaService);
    superCanActivate = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockResolvedValue(true);
  });

  afterEach(() => superCanActivate.mockRestore());

  it('autorise un compte VIEWER authentifié et relit le rôle en base', async () => {
    findUnique.mockResolvedValue({ role: 'VIEWER' });

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { role: true },
    });
  });

  it('refuse un compte ADMIN', async () => {
    findUnique.mockResolvedValue({ role: 'ADMIN' });

    await expect(guard.canActivate(context())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refuse un compte supprimé ou une identité absente', async () => {
    findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(context())).rejects.toThrow(
      ForbiddenException,
    );

    request = {};
    await expect(guard.canActivate(context())).rejects.toThrow(
      ForbiddenException,
    );
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('ne consulte pas le rôle si le JWT de session est invalide', async () => {
    superCanActivate.mockRejectedValue(new Error('JWT invalide'));

    await expect(guard.canActivate(context())).rejects.toThrow('JWT invalide');
    expect(findUnique).not.toHaveBeenCalled();
  });
});
