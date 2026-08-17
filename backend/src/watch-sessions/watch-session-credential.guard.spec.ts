import type { ExecutionContext } from '@nestjs/common';
import { WatchSessionCredentialGuard } from './watch-session-credential.guard';
import { WatchSessionSource } from '../../generated/prisma/enums';

describe('WatchSessionCredentialGuard', () => {
  let requete: { headers: Record<string, string>; user?: unknown };
  let jwtAuthGuard: { canActivate: jest.Mock };
  let extensionAuthGuard: { canActivate: jest.Mock };
  let guard: WatchSessionCredentialGuard;

  /** Contexte HTTP minimal attendu par la garde. */
  const contexte = () =>
    ({
      switchToHttp: () => ({ getRequest: () => requete }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    requete = { headers: {} };
    jwtAuthGuard = { canActivate: jest.fn() };
    extensionAuthGuard = { canActivate: jest.fn() };
    guard = new WatchSessionCredentialGuard(
      jwtAuthGuard as never,
      extensionAuthGuard as never,
    );
  });

  it('délègue à JwtAuthGuard et pose la source LECTEUR_EMBARQUE pour un cookie de session', async () => {
    requete.user = { userId: 'user-1', email: 'kra@example.test' };
    jwtAuthGuard.canActivate.mockResolvedValue(true);

    await expect(guard.canActivate(contexte())).resolves.toBe(true);

    expect(jwtAuthGuard.canActivate).toHaveBeenCalled();
    expect(extensionAuthGuard.canActivate).not.toHaveBeenCalled();
    expect(requete.user).toEqual({
      userId: 'user-1',
      email: 'kra@example.test',
      source: WatchSessionSource.LECTEUR_EMBARQUE,
    });
  });

  it("délègue à ExtensionAuthGuard et pose la source EXTENSION pour un jeton d'extension", async () => {
    requete.headers.authorization = 'Bearer vrx_abc123';
    requete.user = { userId: 'user-1', email: 'kra@example.test' };
    extensionAuthGuard.canActivate.mockResolvedValue(true);

    await expect(guard.canActivate(contexte())).resolves.toBe(true);

    expect(extensionAuthGuard.canActivate).toHaveBeenCalled();
    expect(jwtAuthGuard.canActivate).not.toHaveBeenCalled();
    expect(requete.user).toEqual({
      userId: 'user-1',
      email: 'kra@example.test',
      source: WatchSessionSource.EXTENSION,
    });
  });

  it("un jeton d'extension ne peut pas se voir attribuer la source LECTEUR_EMBARQUE", async () => {
    requete.headers.authorization = 'Bearer vrx_abc123';
    requete.user = { userId: 'user-1', email: 'kra@example.test' };
    extensionAuthGuard.canActivate.mockResolvedValue(true);

    await guard.canActivate(contexte());

    expect(requete.user).toMatchObject({
      source: WatchSessionSource.EXTENSION,
    });
  });

  it('propage le refus de JwtAuthGuard sans poser de source', async () => {
    jwtAuthGuard.canActivate.mockResolvedValue(false);

    await expect(guard.canActivate(contexte())).resolves.toBe(false);
    expect(requete.user).toBeUndefined();
  });

  it("propage le refus d'ExtensionAuthGuard sans poser de source", async () => {
    requete.headers.authorization = 'Bearer vrx_abc123';
    extensionAuthGuard.canActivate.mockResolvedValue(false);

    await expect(guard.canActivate(contexte())).resolves.toBe(false);
    expect(requete.user).toBeUndefined();
  });

  it('un JWT de session web (sans préfixe vrx_) est traité par JwtAuthGuard, jamais par ExtensionAuthGuard', async () => {
    requete.headers.authorization = 'Bearer eyJhbGciOiJIUzI1NiJ9.charge.sig';
    requete.user = { userId: 'user-1', email: 'kra@example.test' };
    jwtAuthGuard.canActivate.mockResolvedValue(true);

    await guard.canActivate(contexte());

    expect(jwtAuthGuard.canActivate).toHaveBeenCalled();
    expect(extensionAuthGuard.canActivate).not.toHaveBeenCalled();
  });
});
