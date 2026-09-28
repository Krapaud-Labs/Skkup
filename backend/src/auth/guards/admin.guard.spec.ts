import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { PrismaService } from '../../prisma/prisma.service';

describe('AdminGuard', () => {
  let requete: {
    user?: { userId: string; email: string };
    path?: string;
  };
  let findUnique: jest.Mock;
  let guard: AdminGuard;
  let superCanActivate: jest.SpyInstance;

  /** Contexte HTTP minimal attendu par la garde. */
  const contexte = () =>
    ({
      switchToHttp: () => ({ getRequest: () => requete }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    requete = { user: { userId: 'user-1', email: 'kra@example.test' } };
    findUnique = jest.fn();
    guard = new AdminGuard({
      user: { findUnique },
    } as unknown as PrismaService);

    // JwtAuthGuard délègue à Passport (appel réseau/DB de la stratégie) :
    // hors de propos ici, on ne teste que la logique propre à AdminGuard.
    superCanActivate = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockResolvedValue(true);
  });

  afterEach(() => {
    superCanActivate.mockRestore();
  });

  it('autorise un compte ADMIN authentifié par JWT de session', async () => {
    findUnique.mockResolvedValue({ role: 'ADMIN' });

    await expect(guard.canActivate(contexte())).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { role: true },
    });
  });

  it('refuse un compte authentifié mais non ADMIN avec un 403', async () => {
    findUnique.mockResolvedValue({ role: 'VIEWER' });

    await expect(guard.canActivate(contexte())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('ne journalise pas une valeur sensible présente dans le chemin fourni', async () => {
    const journal = guard as unknown as {
      logger: { warn: (...args: unknown[]) => void };
    };
    const avertissement = jest
      .spyOn(journal.logger, 'warn')
      .mockImplementation();
    requete = {
      user: { userId: 'user-1', email: 'kra@example.test' },
      path: '/admin/SECRET_TEST',
    };
    findUnique.mockResolvedValue({ role: 'VIEWER' });

    await expect(guard.canActivate(contexte())).rejects.toThrow(
      ForbiddenException,
    );

    expect(JSON.stringify(avertissement.mock.calls)).not.toContain(
      'SECRET_TEST',
    );
    avertissement.mockRestore();
  });

  it("refuse si le compte a disparu entre l'émission du JWT et la requête", async () => {
    findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(contexte())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("ne relit pas le rôle si l'authentification JWT échoue déjà", async () => {
    superCanActivate.mockRejectedValue(new Error('jwt invalide'));

    await expect(guard.canActivate(contexte())).rejects.toThrow('jwt invalide');
    expect(findUnique).not.toHaveBeenCalled();
  });
});
