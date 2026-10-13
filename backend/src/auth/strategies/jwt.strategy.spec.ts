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
  beforeEach(() => {
    process.env.JWT_SECRET = 'secret-de-test';
  });

  it('refuse une session dont la version a été révoquée', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: 'test@example.com',
          sessionVersion: 2,
        }),
      },
    };
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        sessionVersion: 1,
        jourConnexion: jourConnexion(),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepte la version courante et utilise l email en base', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: 'canonique@example.com',
          sessionVersion: 0,
        }),
      },
    };
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'ancien@example.com',
        jourConnexion: jourConnexion(),
      }),
    ).resolves.toEqual({ userId: 'user-1', email: 'canonique@example.com' });
  });

  it('refuse une session web émise un autre jour', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: 'canonique@example.com',
          sessionVersion: 0,
        }),
      },
    };
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);

    await expect(
      strategy.validate(
        fausseRequete({ [nomCookieSession()]: 'cookie-session' }),
        {
          sub: 'user-1',
          email: 'ancien@example.com',
          jourConnexion: jourConnexion(hier),
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepte une session web émise le jour courant', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: 'canonique@example.com',
          sessionVersion: 0,
        }),
      },
    };
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);

    await expect(
      strategy.validate(
        fausseRequete({ [nomCookieSession()]: 'cookie-session' }),
        {
          sub: 'user-1',
          email: 'ancien@example.com',
          jourConnexion: jourConnexion(),
        },
      ),
    ).resolves.toEqual({ userId: 'user-1', email: 'canonique@example.com' });
  });

  it('refuse aussi un ancien JWT web présenté en Bearer', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: 'extension@example.com',
          sessionVersion: 0,
        }),
      },
    };
    const strategy = new JwtStrategy(prisma as unknown as PrismaService);
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);

    await expect(
      strategy.validate(
        fausseRequete({}, { authorization: 'Bearer extension-token' }),
        {
          sub: 'user-1',
          email: 'extension@example.com',
          jourConnexion: jourConnexion(hier),
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
