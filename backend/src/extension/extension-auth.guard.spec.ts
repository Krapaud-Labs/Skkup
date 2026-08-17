import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ExtensionAuthGuard } from './extension-auth.guard';
import type { PrismaService } from '../prisma/prisma.service';
import { empreinteJeton, genererJetonExtension } from './jetons-extension';

describe('ExtensionAuthGuard', () => {
  const jeton = genererJetonExtension();
  let requete: { headers: Record<string, string>; user?: unknown };
  let findUnique: jest.Mock;
  let guard: ExtensionAuthGuard;

  /** Contexte HTTP minimal attendu par la garde. */
  const contexte = () =>
    ({
      switchToHttp: () => ({ getRequest: () => requete }),
    }) as unknown as ExecutionContext;

  const appariementValide = {
    id: 'appariement-1',
    expireAt: new Date(Date.now() + 60_000),
    revoqueAt: null as Date | null,
    user: { id: 'user-1', email: 'kra@example.test' },
  };

  beforeEach(() => {
    requete = { headers: { authorization: `Bearer ${jeton}` } };
    findUnique = jest.fn().mockResolvedValue(appariementValide);
    guard = new ExtensionAuthGuard({
      extensionPairing: { findUnique },
    } as unknown as PrismaService);
  });

  it("authentifie un jeton apparié et pose l'utilisateur sur la requête", async () => {
    await expect(guard.canActivate(contexte())).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: empreinteJeton(jeton) } }),
    );
    expect(requete.user).toEqual({
      userId: 'user-1',
      email: 'kra@example.test',
      appariementId: 'appariement-1',
    });
  });

  it('refuse un jeton révoqué', async () => {
    findUnique.mockResolvedValue({
      ...appariementValide,
      revoqueAt: new Date(),
    });
    await expect(guard.canActivate(contexte())).rejects.toThrow(
      UnauthorizedException,
    );
    expect(requete.user).toBeUndefined();
  });

  it('refuse un jeton expiré', async () => {
    findUnique.mockResolvedValue({
      ...appariementValide,
      expireAt: new Date(Date.now() - 1000),
    });
    await expect(guard.canActivate(contexte())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuse un jeton inconnu', async () => {
    findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(contexte())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // Un JWT de session web ne doit jamais ouvrir les routes de l'extension :
  // les deux credentials restent cloisonnés.
  it("refuse un porteur qui n'a pas le préfixe des jetons d'extension", async () => {
    requete.headers.authorization = 'Bearer eyJhbGciOiJIUzI1NiJ9.charge.sig';
    await expect(guard.canActivate(contexte())).rejects.toThrow(
      UnauthorizedException,
    );
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("refuse une requête sans en-tête d'autorisation", async () => {
    requete.headers = {};
    await expect(guard.canActivate(contexte())).rejects.toThrow(
      UnauthorizedException,
    );
    expect(findUnique).not.toHaveBeenCalled();
  });
});
