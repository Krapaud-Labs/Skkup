import type { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { extraireJetonRequete, JwtStrategy } from './jwt.strategy';
import { jourConnexion, nomCookieSession } from '../cookie-session';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Construction des requêtes de test ───────────────────────────────────────

function fausseRequete(
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
): Request {
  return { cookies, headers } as unknown as Request;
}

describe('extraireJetonRequete', () => {
  // La priorité du cookie empêche un en-tête concurrent de changer l'identité
  // d'une session web déjà authentifiée.
  const secureInitial = process.env.COOKIE_SECURE;

  beforeEach(() => {
    process.env.COOKIE_SECURE = 'true';
  });

  afterAll(() => {
    process.env.COOKIE_SECURE = secureInitial;
  });

  it('lit le jeton dans le cookie de session', () => {
    const requete = fausseRequete({ '__Host-vr_session': 'jeton-cookie' });

    expect(extraireJetonRequete(requete)).toBe('jeton-cookie');
  });

  it("retombe sur l'en-tête Authorization en l'absence de cookie", () => {
    const requete = fausseRequete({}, { authorization: 'Bearer jeton-entete' });

    expect(extraireJetonRequete(requete)).toBe('jeton-entete');
  });

  it('donne la priorité au cookie quand les deux sources sont présentes', () => {
    const requete = fausseRequete(
      { '__Host-vr_session': 'jeton-cookie' },
      { authorization: 'Bearer jeton-entete' },
    );

    expect(extraireJetonRequete(requete)).toBe('jeton-cookie');
  });

  it('ignore un cookie de session vide', () => {
    const requete = fausseRequete(
      { '__Host-vr_session': '' },
      { authorization: 'Bearer jeton-entete' },
    );

    expect(extraireJetonRequete(requete)).toBe('jeton-entete');
  });

  it("ne renvoie aucun jeton quand aucune des deux sources n'est présente", () => {
    expect(extraireJetonRequete(fausseRequete())).toBeNull();
  });

  it('ignore un cookie de session portant un autre nom', () => {
    const requete = fausseRequete({ vr_session: 'jeton-cookie' });

    expect(extraireJetonRequete(requete)).toBeNull();
  });
});

describe('JwtStrategy', () => {
  const sid = '4dd91cf7-fb56-4468-b7f0-4f047dedf26a';
  beforeEach(() => {
    process.env.JWT_SECRET = 'secret-de-test';
  });

  function prismaSession(overrides: Record<string, unknown> = {}) {
    return {
      authSession: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          sessionVersion: 0,
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: {
            email: 'canonique@example.com',
            sessionVersion: 0,
            actif: true,
          },
          ...overrides,
        }),
      },
    };
  }

  it('refuse une session dont la version a été révoquée', async () => {
    const prisma = prismaSession({
      user: { email: 'test@example.com', sessionVersion: 2, actif: true },
    });
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        sid,
        sessionVersion: 1,
        jourConnexion: jourConnexion(),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepte la version courante et utilise l email en base', async () => {
    const prisma = prismaSession();
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'ancien@example.com',
        sid,
        jourConnexion: jourConnexion(),
      }),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'canonique@example.com',
      sessionId: sid,
    });
  });

  it('refuse une session web émise un autre jour', async () => {
    const prisma = prismaSession();
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);

    await expect(
      strategy.validate(
        fausseRequete({ [nomCookieSession()]: 'cookie-session' }),
        {
          sub: 'user-1',
          email: 'ancien@example.com',
          sid,
          jourConnexion: jourConnexion(hier),
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepte une session web émise le jour courant', async () => {
    const prisma = prismaSession();
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);

    await expect(
      strategy.validate(
        fausseRequete({ [nomCookieSession()]: 'cookie-session' }),
        {
          sub: 'user-1',
          email: 'ancien@example.com',
          sid,
          jourConnexion: jourConnexion(),
        },
      ),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'canonique@example.com',
      sessionId: sid,
    });
  });

  it('refuse aussi un ancien JWT web présenté en Bearer', async () => {
    const prisma = prismaSession({
      user: { email: 'extension@example.com', sessionVersion: 0, actif: true },
    });
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);

    await expect(
      strategy.validate(
        fausseRequete({}, { authorization: 'Bearer extension-token' }),
        {
          sub: 'user-1',
          email: 'extension@example.com',
          sid,
          jourConnexion: jourConnexion(hier),
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse un JWT hérité sans identifiant de session persisté', async () => {
    const prisma = prismaSession();
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'ancien@example.com',
        jourConnexion: jourConnexion(),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.authSession.findUnique).not.toHaveBeenCalled();
  });

  it('refuse une session révoquée, expirée ou rattachée à un autre compte', async () => {
    for (const overrides of [
      { revokedAt: new Date() },
      { expiresAt: new Date(Date.now() - 1) },
      { userId: 'user-other' },
    ]) {
      const strategy = new JwtStrategy(
        prismaSession(overrides) as unknown as PrismaService,
      );
      await expect(
        strategy.validate({
          sub: 'user-1',
          email: 'test@example.com',
          sid,
          jourConnexion: jourConnexion(),
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });
});
