import { sautsDeProxyDeConfiance } from './proxy-de-confiance';

describe('sautsDeProxyDeConfiance', () => {
  const valeurInitiale = process.env.TRUSTED_PROXY_HOPS;

  afterEach(() => {
    if (valeurInitiale === undefined) {
      delete process.env.TRUSTED_PROXY_HOPS;
    } else {
      process.env.TRUSTED_PROXY_HOPS = valeurInitiale;
    }
  });

  it('ne fait confiance à aucun proxy par défaut', () => {
    delete process.env.TRUSTED_PROXY_HOPS;
    expect(sautsDeProxyDeConfiance()).toBe(0);
  });

  it('traite une valeur vide comme une absence de proxy', () => {
    process.env.TRUSTED_PROXY_HOPS = '   ';
    expect(sautsDeProxyDeConfiance()).toBe(0);
  });

  it('lit le nombre de sauts déclaré', () => {
    process.env.TRUSTED_PROXY_HOPS = '1';
    expect(sautsDeProxyDeConfiance()).toBe(1);
  });

  // Un repli silencieux sur 0 rendrait la limitation par IP inopérante
  // sans que rien ne le signale : mieux vaut refuser de démarrer.
  it.each(['true', '-1', '1.5', 'deux'])(
    'refuse de démarrer sur une valeur inexploitable (%s)',
    (valeur) => {
      process.env.TRUSTED_PROXY_HOPS = valeur;
      expect(() => sautsDeProxyDeConfiance()).toThrow('TRUSTED_PROXY_HOPS');
    },
  );
});
