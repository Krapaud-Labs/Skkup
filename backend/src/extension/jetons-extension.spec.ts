import {
  empreinteJeton,
  genererCodeAppariement,
  genererJetonExtension,
  normaliserCodeAppariement,
  PREFIXE_JETON_EXTENSION,
} from './jetons-extension';

describe('jetons-extension', () => {
  // ─── Code d'appariement ────────────────────────────────────────────────────
  it('produit un code lisible de 12 caractères sans sosie visuel', () => {
    const { code, codeNormalise } = genererCodeAppariement();
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){2}$/);
    expect(codeNormalise).toHaveLength(12);
    expect(codeNormalise).not.toMatch(/[ILOU]/);
    expect(normaliserCodeAppariement(code)).toBe(codeNormalise);
  });

  it('ne répète pas le même code sur un grand nombre de tirages', () => {
    const tirages = new Set(
      Array.from({ length: 500 }, () => genererCodeAppariement().code),
    );
    expect(tirages.size).toBe(500);
  });

  it.each([
    ['abcd-efgh-jkmn', 'ABCDEFGHJKMN'],
    [' ABCD EFGH JKMN ', 'ABCDEFGHJKMN'],
    // O, I et L n'appartiennent pas à l'alphabet : ils sont rapprochés de
    // leur sosie plutôt que rejetés, une confusion de lecture ne doit pas
    // faire échouer un code valide.
    ['O123-I456-L789', '012314561789'],
  ])('normalise la saisie %s', (saisie, attendu) => {
    expect(normaliserCodeAppariement(saisie)).toBe(attendu);
  });

  it.each([
    ['trop court', 'ABCD-EFGH'],
    ['trop long', 'ABCD-EFGH-JKMN-PQRS'],
    ['caractère hors alphabet', 'ABCD-EFGH-JKMU'],
    ['vide', ''],
  ])('refuse une saisie %s', (_cas, saisie) => {
    expect(normaliserCodeAppariement(saisie)).toBeNull();
  });

  // ─── Jeton d'accès et empreintes ───────────────────────────────────────────
  it("préfixe le jeton d'extension et lui donne 256 bits d'aléa", () => {
    const jeton = genererJetonExtension();
    expect(jeton.startsWith(PREFIXE_JETON_EXTENSION)).toBe(true);
    const aleatoire = jeton.slice(PREFIXE_JETON_EXTENSION.length);
    expect(Buffer.from(aleatoire, 'base64url')).toHaveLength(32);
    expect(genererJetonExtension()).not.toBe(jeton);
  });

  it('produit une empreinte stable qui ne contient pas le secret', () => {
    const jeton = genererJetonExtension();
    expect(empreinteJeton(jeton)).toBe(empreinteJeton(jeton));
    expect(empreinteJeton(jeton)).toMatch(/^[0-9a-f]{64}$/);
    expect(empreinteJeton(jeton)).not.toContain(jeton.slice(4, 12));
  });
});
