import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { OAuthTwitchService } from './oauth-twitch.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

describe('OAuthTwitchService', () => {
  const configurationInitiale = { ...process.env };
  let service: OAuthTwitchService;
  let jwt: JwtService;
  let prisma: {
    oAuthState: { create: jest.Mock; updateMany: jest.Mock };
    linkedPlatformAccount: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'secret-de-test-twitch';
    process.env.TWITCH_CLIENT_ID = 'client-twitch';
    process.env.TWITCH_REDIRECT_URI =
      'http://localhost:3001/auth/oauth/twitch/callback';
    process.env.TWITCH_CLIENT_SECRET = 'secret-twitch';
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString(
      'base64',
    );
    jwt = new JwtService({ secret: process.env.JWT_SECRET });
    prisma = {
      oAuthState: {
        create: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      linkedPlatformAccount: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new OAuthTwitchService(prisma as unknown as PrismaService, jwt);
  });

  afterAll(() => {
    process.env = configurationInitiale;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('génère une URL Twitch avec scope minimal et état signé', async () => {
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const url = new URL(resultat.url);
    expect(url.origin).toBe('https://id.twitch.tv');
    expect(url.searchParams.get('scope')).toBe('user:read:email');
    expect(url.searchParams.get('redirect_uri')).toBe(
      process.env.TWITCH_REDIRECT_URI,
    );
    expect(resultat.nonce).toHaveLength(43);
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

  it('refuse un état déjà consommé avant tout appel à Twitch', async () => {
    prisma.oAuthState.updateMany.mockResolvedValue({ count: 0 });
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(resultat.url).searchParams.get('state')!;

    await expect(
      service.traiterRetour('code', state, resultat.nonce),
    ).rejects.toThrow('État OAuth Twitch déjà utilisé.');
    expect(prisma.oAuthState.updateMany).toHaveBeenCalledTimes(1);
  });

  it('renouvelle les credentials du compte Twitch déjà lié', async () => {
    const utilisateur = { id: 'user-1', email: 'alice@example.com' };
    const miseAJour = jest.fn().mockResolvedValue({});
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: object) => Promise<unknown>) =>
        operation({
          linkedPlatformAccount: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'liaison-1',
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
          Promise.resolve({ access_token: 'token', expires_in: 3600 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                id: 'twitch-1',
                login: 'alice',
                display_name: 'Alice',
                email: 'alice@example.com',
              },
            ],
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

  it('relit le propriétaire après un conflit concurrent sans écraser ses credentials', async () => {
    const gagnant = { id: 'user-gagnant', email: 'gagnant@example.com' };
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Contrainte unique', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );
    prisma.linkedPlatformAccount.findUnique.mockResolvedValue({
      userId: gagnant.id,
      user: gagnant,
    });
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ access_token: 'token', expires_in: 3600 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                id: 'twitch-concurrent',
                login: 'gagnant',
                display_name: 'Gagnant',
                email: 'gagnant@example.com',
              },
            ],
          }),
      } as Response);
    const resultat = await service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(resultat.url).searchParams.get('state')!;

    await expect(
      service.traiterRetour('code', state, resultat.nonce),
    ).resolves.toBe(gagnant);
    expect(prisma.linkedPlatformAccount.findUnique).toHaveBeenCalledTimes(1);
  });
});
