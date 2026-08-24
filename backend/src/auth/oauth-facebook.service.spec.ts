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
    };
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
    ).rejects.toThrow('Permissions Facebook insuffisantes ou refusées.');
  });
});
