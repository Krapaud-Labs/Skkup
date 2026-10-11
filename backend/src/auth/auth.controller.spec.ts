import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DUREE_SESSION_SECONDES } from './cookie-session';

// ─── Mise en place ───────────────────────────────────────────────────────────
interface ReponseSimulee {
  cookie: jest.Mock;
  clearCookie: jest.Mock;
  redirect: jest.Mock;
}

function fausseReponse(): ReponseSimulee {
  return { cookie: jest.fn(), clearCookie: jest.fn(), redirect: jest.fn() };
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    session: jest.Mock;
    changerMotDePasse: jest.Mock;
    deconnecter: jest.Mock;
  };
  let reponse: ReponseSimulee;
  const secureInitial = process.env.COOKIE_SECURE;

  beforeEach(() => {
    process.env.COOKIE_SECURE = 'true';
    authService = {
      register: jest
        .fn()
        .mockResolvedValue({ accessToken: 'jeton-signe', pseudo: 'Alice' }),
      login: jest
        .fn()
        .mockResolvedValue({ accessToken: 'jeton-signe', pseudo: 'Alice' }),
      session: jest
        .fn()
        .mockResolvedValue({ authentifie: false, profil: null }),
      changerMotDePasse: jest.fn().mockResolvedValue(undefined),
      deconnecter: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AuthController(authService as unknown as AuthService);
    reponse = fausseReponse();
  });

  afterAll(() => {
    process.env.COOKIE_SECURE = secureInitial;
  });

  const dtoInscription = {
    email: 'alice@example.com',
    motDePasse: 'MotDePasse123',
    pseudo: 'Alice',
    accepteReglement: true,
  };
  const dtoConnexion = {
    email: 'alice@example.com',
    motDePasse: 'MotDePasse123',
  };

  // ─── Pose du cookie ────────────────────────────────────────────────────────
  it('décrit une session anonyme sans erreur 401', async () => {
    await expect(controller.session({} as never)).resolves.toEqual({
      authentifie: false,
      profil: null,
    });
    expect(authService.session).toHaveBeenCalledWith(undefined);
  });

  it("pose le jeton dans un cookie httpOnly à l'inscription", async () => {
    await controller.register(dtoInscription, reponse as unknown as Response);

    expect(reponse.cookie).toHaveBeenCalledWith(
      '__Host-vr_session',
      'jeton-signe',
      {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: DUREE_SESSION_SECONDES * 1000,
      },
    );
  });

  it('pose le jeton dans un cookie httpOnly à la connexion', async () => {
    await controller.login(dtoConnexion, reponse as unknown as Response);

    expect(reponse.cookie).toHaveBeenCalledWith(
      '__Host-vr_session',
      'jeton-signe',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
  });

  it('ne renvoie jamais le jeton dans le corps de la réponse', async () => {
    const inscription = await controller.register(
      dtoInscription,
      reponse as unknown as Response,
    );
    const connexion = await controller.login(
      dtoConnexion,
      reponse as unknown as Response,
    );

    expect(inscription).toEqual({ pseudo: 'Alice' });
    expect(connexion).toEqual({ pseudo: 'Alice' });
    expect(JSON.stringify(connexion)).not.toContain('jeton-signe');
  });

  it('retombe sur un nom de cookie sans préfixe quand Secure est désactivé', async () => {
    process.env.COOKIE_SECURE = 'false';

    await controller.login(dtoConnexion, reponse as unknown as Response);

    expect(reponse.cookie).toHaveBeenCalledWith(
      'vr_session',
      'jeton-signe',
      expect.objectContaining({ secure: false, httpOnly: true }),
    );
  });

  // ─── Déconnexion ───────────────────────────────────────────────────────────
  it('révoque la session courante et efface le cookie', async () => {
    await controller.logout(
      { user: { userId: 'user-1', email: 'alice@example.com' } } as never,
      reponse as unknown as Response,
    );

    expect(authService.deconnecter).toHaveBeenCalledWith('user-1');
    expect(reponse.clearCookie).toHaveBeenCalledWith('__Host-vr_session', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('efface le cookie même sans session valide', async () => {
    await controller.logout({} as never, reponse as unknown as Response);

    expect(authService.deconnecter).not.toHaveBeenCalled();
    expect(reponse.clearCookie).toHaveBeenCalled();
  });

  it('révoque le mot de passe via la session authentifiée et efface le cookie', async () => {
    await controller.changerMotDePasse(
      { user: { userId: 'user-1', email: 'alice@example.com' } } as never,
      {
        ancienMotDePasse: 'AncienMotDePasse1',
        nouveauMotDePasse: 'NouveauMotDePasse2',
      },
      reponse as unknown as Response,
    );

    expect(authService.changerMotDePasse).toHaveBeenCalledWith('user-1', {
      ancienMotDePasse: 'AncienMotDePasse1',
      nouveauMotDePasse: 'NouveauMotDePasse2',
    });
    expect(reponse.clearCookie).toHaveBeenCalledWith(
      '__Host-vr_session',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });
});
