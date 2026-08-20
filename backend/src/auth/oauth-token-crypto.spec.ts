import { chiffrerCredentialOAuth } from './oauth-token-crypto';

describe('chiffrerCredentialOAuth', () => {
  const cleInitiale = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

  afterAll(() => {
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = cleInitiale;
  });

  it('ne conserve jamais le token en clair', () => {
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      'base64',
    );
    const chiffre = chiffrerCredentialOAuth({ access_token: 'secret-twitch' });
    expect(chiffre.startsWith('v1.')).toBe(true);
    expect(chiffre).not.toContain('secret-twitch');
  });
});
