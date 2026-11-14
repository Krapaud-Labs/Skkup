import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';

const VERSION_CLE = 'v1';
const ALGORITHME = 'aes-256-gcm';

function lireCle(): Buffer {
  const valeur = process.env.SHOP_CODE_ENCRYPTION_KEY_V1;
  if (!valeur || !/^[a-fA-F0-9]{64}$/.test(valeur)) {
    throw new ServiceUnavailableException(
      'La clé de chiffrement de la boutique est indisponible.',
    );
  }
  return Buffer.from(valeur, 'hex');
}

export function empreinteCode(code: string): string {
  return createHash('sha256')
    .update(code.trim().normalize('NFC'), 'utf8')
    .digest('hex');
}

export function chiffrerCode(code: string): {
  ciphertext: string;
  keyVersion: string;
  codeHash: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHME, lireCle(), iv);
  const contenu = Buffer.concat([
    cipher.update(code.trim().normalize('NFC'), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: `${iv.toString('base64url')}.${tag.toString('base64url')}.${contenu.toString('base64url')}`,
    keyVersion: VERSION_CLE,
    codeHash: empreinteCode(code),
  };
}

export function dechiffrerCode(ciphertext: string, keyVersion: string): string {
  if (keyVersion !== VERSION_CLE) {
    throw new ServiceUnavailableException(
      'La version de la clé de chiffrement du code n’est pas disponible.',
    );
  }
  const [ivBase64, tagBase64, contenuBase64, surplus] = ciphertext.split('.');
  if (!ivBase64 || !tagBase64 || !contenuBase64 || surplus) {
    throw new ServiceUnavailableException(
      'Le code numérique ne peut pas être révélé actuellement.',
    );
  }
  try {
    const decipher = createDecipheriv(
      ALGORITHME,
      lireCle(),
      Buffer.from(ivBase64, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagBase64, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(contenuBase64, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    if (error instanceof ServiceUnavailableException) throw error;
    throw new ServiceUnavailableException(
      'Le code numérique ne peut pas être révélé actuellement.',
    );
  }
}
