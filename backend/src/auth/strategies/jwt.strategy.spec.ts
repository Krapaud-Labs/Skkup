import type { Request } from 'express';
import { extraireJetonRequete } from './jwt.strategy';

function fausseRequete(
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
): Request {
  return { cookies, headers } as unknown as Request;
}

describe('extraireJetonRequete', () => {
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
