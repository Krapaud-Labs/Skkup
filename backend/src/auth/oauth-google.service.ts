import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { Platform, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { chiffrerCredentialOAuth } from './oauth-token-crypto';
import { extraireJetonRequete } from './strategies/jwt.strategy';

const AUDIENCE_ETAT = 'oauth-google-state';
const DUREE_ETAT = '10m';
const DUREE_ETAT_MILLISECONDES = 10 * 60 * 1000;
const DELAI_GOOGLE_MILLISECONDES = 10_000;
const SCOPES_GOOGLE = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/youtube.readonly',
] as const;

interface EtatOAuth {
  nonce: string;
  userId?: string;
}

interface ProfilGoogle {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
}

@Injectable()
export class OAuthGoogleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async creerDemarrage(request: Request) {
    const clientId = this.exigerConfiguration('GOOGLE_CLIENT_ID');
    const redirectUri = this.exigerConfiguration('GOOGLE_REDIRECT_URI');
    const nonce = randomBytes(32).toString('base64url');
    const session = this.lireSessionOptionnelle(request);
    const state = this.jwt.sign(
      { nonce, ...(session ? { userId: session.sub } : {}) },
      { audience: AUDIENCE_ETAT, expiresIn: DUREE_ETAT },
    );
    await this.prisma.oAuthState.create({
      data: {
        nonceHash: this.empreinteNonce(nonce),
        provider: Platform.YOUTUBE,
        userId: session?.sub,
        expiresAt: new Date(Date.now() + DUREE_ETAT_MILLISECONDES),
      },
    });

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPES_GOOGLE.join(' '));
    url.searchParams.set('access_type', 'offline');
    // Le consentement explicite garantit un refresh token utilisable pour les
    // futurs appels YouTube, y compris après une autorisation antérieure.
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);
    return { url: url.toString(), nonce };
  }

  async traiterRetour(code: string, state: string, nonceCookie: string) {
    let etat: EtatOAuth;
    try {
      etat = this.jwt.verify<EtatOAuth>(state, { audience: AUDIENCE_ETAT });
    } catch {
      throw new UnauthorizedException(
        'The Google OAuth state is invalid or expired.',
      );
    }
    if (!nonceCookie || etat.nonce !== nonceCookie) {
      throw new UnauthorizedException(
        'The Google OAuth state is inconsistent.',
      );
    }
    const consommation = await this.prisma.oAuthState.updateMany({
      where: {
        nonceHash: this.empreinteNonce(etat.nonce),
        provider: Platform.YOUTUBE,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (consommation.count !== 1) {
      throw new UnauthorizedException(
        'The Google OAuth state has already been used.',
      );
    }

    const credentials = await this.echangerCode(code);
    const profil = await this.chargerProfil(credentials.access_token);
    const credentialChiffre = chiffrerCredentialOAuth(credentials);
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const compteLie = await transaction.linkedPlatformAccount.findUnique({
            where: {
              platform_externalAccountId: {
                platform: Platform.YOUTUBE,
                externalAccountId: profil.sub,
              },
            },
            include: { user: true },
          });
          if (compteLie) {
            if (etat.userId && compteLie.userId !== etat.userId) {
              throw new ConflictException(
                'Ce compte Google est déjà lié à un autre compte.',
              );
            }
            await transaction.linkedPlatformAccount.update({
              where: { id: compteLie.id },
              data: { oauthTokenEncrypted: credentialChiffre },
            });
            return compteLie.user;
          }

          let utilisateur = etat.userId
            ? await transaction.user.findUnique({ where: { id: etat.userId } })
            : null;
          if (!utilisateur) {
            const email = profil.email.toLowerCase();
            const emailExistant = await transaction.user.findUnique({
              where: { email },
            });
            if (emailExistant) {
              throw new ConflictException(
                'Connecte-toi avec ton compte existant avant de lier Google.',
              );
            }
            utilisateur = await transaction.user.create({
              data: {
                email,
                pseudo: profil.name || email.split('@')[0],
                passwordHash: await bcrypt.hash(
                  randomBytes(32).toString('hex'),
                  12,
                ),
              },
            });
          }

          await transaction.linkedPlatformAccount.create({
            data: {
              userId: utilisateur.id,
              platform: Platform.YOUTUBE,
              externalAccountId: profil.sub,
              oauthTokenEncrypted: credentialChiffre,
            },
          });
          return utilisateur;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (erreur) {
      if (
        !(erreur instanceof Prisma.PrismaClientKnownRequestError) ||
        erreur.code !== 'P2002'
      ) {
        throw erreur;
      }
      const gagnant = await this.prisma.linkedPlatformAccount.findUnique({
        where: {
          platform_externalAccountId: {
            platform: Platform.YOUTUBE,
            externalAccountId: profil.sub,
          },
        },
        include: { user: true },
      });
      if (!gagnant || (etat.userId && gagnant.userId !== etat.userId)) {
        throw new ConflictException(
          'Ce compte Google est déjà lié à un autre compte.',
        );
      }
      return gagnant.user;
    }
  }

  private lireSessionOptionnelle(request: Request): { sub: string } | null {
    const token = extraireJetonRequete(request);
    if (!token) return null;
    try {
      return this.jwt.verify<{ sub: string }>(token);
    } catch {
      return null;
    }
  }

  private async echangerCode(code: string) {
    const reponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.exigerConfiguration('GOOGLE_CLIENT_ID'),
        client_secret: this.exigerConfiguration('GOOGLE_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.exigerConfiguration('GOOGLE_REDIRECT_URI'),
      }),
      signal: AbortSignal.timeout(DELAI_GOOGLE_MILLISECONDES),
    });
    if (!reponse.ok) {
      throw new UnauthorizedException('The Google OAuth exchange was refused.');
    }
    const credentials = (await reponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: string;
      id_token?: string;
    };
    if (
      !credentials.access_token ||
      !credentials.refresh_token ||
      typeof credentials.scope !== 'string' ||
      !Number.isFinite(credentials.expires_in)
    ) {
      throw new UnauthorizedException('The Google OAuth response is invalid.');
    }
    const scopesRecus = new Set(credentials.scope.trim().split(/\s+/));
    if (
      scopesRecus.size !== SCOPES_GOOGLE.length ||
      SCOPES_GOOGLE.some((scope) => !scopesRecus.has(scope))
    ) {
      throw new UnauthorizedException('The Google OAuth scopes are invalid.');
    }
    return credentials;
  }

  private async chargerProfil(accessToken: string): Promise<ProfilGoogle> {
    const reponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(DELAI_GOOGLE_MILLISECONDES),
      },
    );
    if (!reponse.ok) {
      throw new UnauthorizedException('The Google profile is inaccessible.');
    }
    const profil = (await reponse.json()) as Partial<ProfilGoogle>;
    if (!profil.sub || !profil.email || profil.email_verified !== true) {
      throw new UnauthorizedException(
        'Le compte Google ne fournit pas d’email vérifié.',
      );
    }
    return profil as ProfilGoogle;
  }

  private exigerConfiguration(nom: string): string {
    const valeur = process.env[nom];
    if (!valeur) {
      throw new ServiceUnavailableException(`Configuration ${nom} absente.`);
    }
    return valeur;
  }

  private empreinteNonce(nonce: string): string {
    return createHash('sha256').update(nonce).digest('hex');
  }
}
