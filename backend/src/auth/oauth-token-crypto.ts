import { createCipheriv, randomBytes } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';

/** Chiffre les credentials tiers avant toute écriture en base. */
export function chiffrerCredentialOAuth(valeur: unknown): string {
  const cleBrute = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  const cle = cleBrute ? Buffer.from(cleBrute, 'base64') : Buffer.alloc(0);
  if (cle.length !== 32) {
    throw new ServiceUnavailableException(
      'OAuth account encryption is unavailable.',
    );
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', cle, iv);
  const chiffre = Buffer.concat([
    cipher.update(JSON.stringify(valeur), 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    chiffre.toString('base64url'),
  ].join('.');
}
