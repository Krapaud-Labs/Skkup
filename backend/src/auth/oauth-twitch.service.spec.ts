import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { OAuthTwitchService } from './oauth-twitch.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OAuthTwitchService', () => {
  const configurationInitiale = { ...process.env };
  let service: OAuthTwitchService;
  let jwt: JwtService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'secret-de-test-twitch';
    process.env.TWITCH_CLIENT_ID = 'client-twitch';
    process.env.TWITCH_REDIRECT_URI =
      'http://localhost:3001/auth/oauth/twitch/callback';
    jwt = new JwtService({ secret: process.env.JWT_SECRET });
    service = new OAuthTwitchService({} as PrismaService, jwt);
  });

  afterAll(() => {
    process.env = configurationInitiale;
  });

  it('génère une URL Twitch avec scope minimal et état signé', () => {
    const resultat = service.creerDemarrage({
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
  });

  it('refuse un callback dont le cookie ne correspond pas à l’état', async () => {
    const resultat = service.creerDemarrage({
      cookies: {},
      headers: {},
    } as Request);
    const state = new URL(resultat.url).searchParams.get('state')!;
    await expect(
      service.traiterRetour('code', state, 'mauvais-nonce'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
