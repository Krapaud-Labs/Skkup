import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { OAuthFacebookService } from './oauth-facebook.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OAuthFacebookService', () => {
  const configurationInitiale = { ...process.env };
  let service: OAuthFacebookService;
  let prisma: {
    oAuthState: { create: jest.Mock; updateMany: jest.Mock };
    linkedPlatformAccount: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'secret-de-test-facebook';
    process.env.FACEBOOK_CLIENT_ID = 'client-facebook';
    process.env.FACEBOOK_CLIENT_SECRET = 'secret-facebook';
    process.env.FACEBOOK_REDIRECT_URI =
      'http://localhost:3001/auth/oauth/facebook/callback';
    prisma = {
      oAuthState: {
        create: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      linkedPlatformAccount: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 2).toString(
      'base64',
    );
    service = new OAuthFacebookService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: process.env.JWT_SECRET }),
    );
  });

  afterAll(() => {
    process.env = configurationInitiale;
  });

  it('génère une URL Facebook avec les scopes minimaux', async () => {
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const url = new URL(resultat.url);
    expect(url.origin).toBe('https://www.facebook.com');
    expect(url.pathname).toBe('/v23.0/dialog/oauth');
    expect(url.searchParams.get('scope')).toBe('email,public_profile');
    expect(url.searchParams.get('redirect_uri')).toBe(
      process.env.FACEBOOK_REDIRECT_URI,
    );
    expect(prisma.oAuthState.create).toHaveBeenCalledTimes(1);
  });

  it('refuse un callback dont le cookie ne correspond pas à l’état', async () => {
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(resultat.url).searchParams.get('state')!;

    await expect(
      service.traiterRetour('code', state, 'mauvais-nonce'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('échange le code sans exposer le secret dans l’URL', async () => {
    const requete = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'token-facebook' }),
    } as Response);

    await (
      service as unknown as {
        echangerCode: (code: string) => Promise<unknown>;
      }
    ).echangerCode('code-test');

    const [url, options] = requete.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain(process.env.FACEBOOK_CLIENT_SECRET);
    expect(options.method).toBe('POST');
    expect((options.body as URLSearchParams).toString()).toContain(
      'client_secret=',
    );
  });

  it('refuse les permissions Facebook non accordées', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ permission: 'public_profile', status: 'granted' }],
        }),
    } as Response);

    await expect(
      (
        service as unknown as {
          verifierPermissions: (token: string) => Promise<void>;
        }
      ).verifierPermissions('token-facebook'),
    ).rejects.toThrow('Facebook permissions are insufficient or were denied.');
  });

  it('accepte exactement les permissions demandées et refuse une permission supplémentaire', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { permission: 'email', status: 'granted' },
            { permission: 'public_profile', status: 'granted' },
          ],
        }),
    } as Response);
    await (
      service as unknown as {
        verifierPermissions: (token: string) => Promise<void>;
      }
    ).verifierPermissions('token-facebook');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { permission: 'email', status: 'granted' },
            { permission: 'public_profile', status: 'granted' },
            { permission: 'user_friends', status: 'granted' },
          ],
        }),
    } as Response);
    await expect(
      (
        service as unknown as {
          verifierPermissions: (token: string) => Promise<void>;
        }
      ).verifierPermissions('token-facebook'),
    ).rejects.toThrow('Facebook permissions are insufficient or were denied.');
  });

  it('valide le callback, chiffre le token et crée la liaison', async () => {
    const utilisateur = { id: 'user-1', email: 'alice@example.com' };
    const createLink = jest.fn().mockResolvedValue({});
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: object) => Promise<unknown>) =>
        operation({
          linkedPlatformAccount: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: createLink,
          },
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(utilisateur),
          },
        }),
    );
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'token-facebook' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { permission: 'email', status: 'granted' },
              { permission: 'public_profile', status: 'granted' },
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'facebook-1',
            name: 'Alice',
            email: 'alice@example.com',
          }),
      } as Response);
    const demarrage = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(demarrage.url).searchParams.get('state')!;

    await expect(
      service.traiterRetour('code', state, demarrage.nonce),
    ).resolves.toBe(utilisateur);
    const appels = createLink.mock.calls as unknown as Array<
      [{ data: { platform: string; oauthTokenEncrypted: string } }]
    >;
    const liaison = appels[0][0];
    expect(liaison.data.platform).toBe('FACEBOOK');
    expect(liaison.data.oauthTokenEncrypted).not.toContain('token-facebook');
  });

  it('refuse un rejeu et une clé de chiffrement absente', async () => {
    prisma.oAuthState.updateMany.mockResolvedValue({ count: 0 });
    const demarrage = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(demarrage.url).searchParams.get('state')!;
    await expect(
      service.traiterRetour('code', state, demarrage.nonce),
    ).rejects.toThrow('Facebook OAuth state has already been used.');

    prisma.oAuthState.updateMany.mockResolvedValue({ count: 1 });
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = '';
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'token-facebook' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { permission: 'email', status: 'granted' },
              { permission: 'public_profile', status: 'granted' },
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ id: 'facebook-1', email: 'alice@example.com' }),
      } as Response);
    const second = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const secondState = new URL(second.url).searchParams.get('state')!;
    await expect(
      service.traiterRetour('code', secondState, second.nonce),
    ).rejects.toThrow('OAuth account encryption is unavailable.');
  });
});
