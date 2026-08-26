import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthTwitchService } from './oauth-twitch.service';
import { OAuthGoogleService } from './oauth-google.service';
import { OAuthFacebookService } from './oauth-facebook.service';
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
    changerMotDePasse: jest.Mock;
  };
  let oauthTwitch: { creerDemarrage: jest.Mock; traiterRetour: jest.Mock };
  let oauthGoogle: { creerDemarrage: jest.Mock; traiterRetour: jest.Mock };
  let oauthFacebook: { creerDemarrage: jest.Mock; traiterRetour: jest.Mock };
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
      changerMotDePasse: jest.fn().mockResolvedValue(undefined),
    };
    oauthTwitch = {
      creerDemarrage: jest.fn().mockResolvedValue({
        url: 'https://id.twitch.tv/oauth2/authorize',
        nonce: 'nonce-test',
      }),
      traiterRetour: jest.fn(),
    };
    oauthGoogle = {
      creerDemarrage: jest.fn().mockResolvedValue({
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        nonce: 'nonce-google',
      }),
      traiterRetour: jest.fn(),
    };
    oauthFacebook = {
      creerDemarrage: jest.fn().mockResolvedValue({
        url: 'https://www.facebook.com/v23.0/dialog/oauth',
        nonce: 'nonce-facebook',
      }),
      traiterRetour: jest.fn(),
    };
    controller = new AuthController(
      authService as unknown as AuthService,
      oauthTwitch as unknown as OAuthTwitchService,
      oauthGoogle as unknown as OAuthGoogleService,
      oauthFacebook as unknown as OAuthFacebookService,
    );
    reponse = fausseReponse();
  });

  afterAll(() => {
    process.env.COOKIE_SECURE = secureInitial;
  });

  const dtoInscription = {
    email: 'alice@example.com',
    motDePasse: 'MotDePasse123',
    pseudo: 'Alice',
  };
  const dtoConnexion = {
    email: 'alice@example.com',
    motDePasse: 'MotDePasse123',
  };

  // ─── Pose du cookie ────────────────────────────────────────────────────────
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

  it("protège le cookie d'état OAuth avec le préfixe Host en production", async () => {
    await controller.oauthTwitchStart(
      { cookies: {}, headers: {} } as never,
      reponse as unknown as Response,
    );

    expect(reponse.cookie).toHaveBeenCalledWith(
      '__Host-vr_oauth_twitch_state',
      'nonce-test',
      expect.objectContaining({ secure: true, httpOnly: true, path: '/' }),
    );
    expect(reponse.redirect).toHaveBeenCalledWith(
      'https://id.twitch.tv/oauth2/authorize',
    );
  });

  it("protège aussi le cookie d'état Google avec le préfixe Host", async () => {
    await controller.oauthGoogleStart(
      { cookies: {}, headers: {} } as never,
      reponse as unknown as Response,
    );

    expect(reponse.cookie).toHaveBeenCalledWith(
      '__Host-vr_oauth_google_state',
      'nonce-google',
      expect.objectContaining({ secure: true, httpOnly: true, path: '/' }),
    );
    expect(reponse.redirect).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
  });

  it("protège aussi le cookie d'état Facebook avec le préfixe Host", async () => {
    await controller.oauthFacebookStart(
      { cookies: {}, headers: {} } as never,
      reponse as unknown as Response,
    );

    expect(reponse.cookie).toHaveBeenCalledWith(
      '__Host-vr_oauth_facebook_state',
      'nonce-facebook',
      expect.objectContaining({ secure: true, httpOnly: true, path: '/' }),
    );
    expect(reponse.redirect).toHaveBeenCalledWith(
      'https://www.facebook.com/v23.0/dialog/oauth',
    );
  });

  // ─── Déconnexion ───────────────────────────────────────────────────────────
  it('efface le cookie avec exactement les attributs de portée de la pose', () => {
    controller.logout(reponse as unknown as Response);

    expect(reponse.clearCookie).toHaveBeenCalledWith('__Host-vr_session', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
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
