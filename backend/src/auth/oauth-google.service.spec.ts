import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthGoogleService } from './oauth-google.service';

describe('OAuthGoogleService', () => {
  const configurationInitiale = { ...process.env };
  let service: OAuthGoogleService;
  let prisma: {
    oAuthState: { create: jest.Mock; updateMany: jest.Mock };
    linkedPlatformAccount: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'secret-de-test-google';
    process.env.GOOGLE_CLIENT_ID = 'client-google';
    process.env.GOOGLE_REDIRECT_URI =
      'http://localhost:3001/auth/oauth/google/callback';
    process.env.GOOGLE_CLIENT_SECRET = 'secret-google';
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 2).toString(
      'base64',
    );
    prisma = {
      oAuthState: {
        create: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      linkedPlatformAccount: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new OAuthGoogleService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: process.env.JWT_SECRET }),
    );
  });

  afterAll(() => {
    process.env = configurationInitiale;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('demande uniquement l’identité et YouTube en lecture seule', async () => {
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const url = new URL(resultat.url);

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('scope')?.split(' ')).toEqual([
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/youtube.readonly',
    ]);
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
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

  it('refuse un état déjà consommé avant tout appel à Google', async () => {
    prisma.oAuthState.updateMany.mockResolvedValue({ count: 0 });
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(resultat.url).searchParams.get('state')!;

    await expect(
      service.traiterRetour('code', state, resultat.nonce),
    ).rejects.toThrow('Google OAuth state has already been used.');
  });

  it('lie un profil Google vérifié avec un refresh token', async () => {
    const utilisateur = { id: 'user-google', email: 'alice@example.com' };
    const miseAJour = jest.fn().mockResolvedValue({});
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: object) => Promise<unknown>) =>
        operation({
          linkedPlatformAccount: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'liaison-google',
              userId: utilisateur.id,
              user: utilisateur,
            }),
            update: miseAJour,
          },
        }),
    );
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'access-google',
            refresh_token: 'refresh-google',
            expires_in: 3600,
            scope:
              'openid email profile https://www.googleapis.com/auth/youtube.readonly',
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            sub: 'google-1',
            email: 'alice@example.com',
            email_verified: true,
            name: 'Alice',
          }),
      } as Response);
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(resultat.url).searchParams.get('state')!;

    await expect(
      service.traiterRetour('code', state, resultat.nonce),
    ).resolves.toBe(utilisateur);
    expect(miseAJour).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['openid email profile', 'sans le scope YouTube'],
    [
      'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/drive.readonly',
      'avec un scope supplémentaire',
    ],
  ])('refuse les scopes non conformes %s (%s)', async (scope) => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'access-google',
          refresh_token: 'refresh-google',
          expires_in: 3600,
          scope,
        }),
    } as Response);
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(resultat.url).searchParams.get('state')!;

    await expect(
      service.traiterRetour('code', state, resultat.nonce),
    ).rejects.toThrow('Google OAuth scopes are invalid.');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
