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
import { extraireJetonRequete } from './strategies/jwt.strategy';
import { chiffrerCredentialOAuth } from './oauth-token-crypto';

const AUDIENCE_ETAT = 'oauth-twitch-state';
const DUREE_ETAT = '10m';
const DUREE_ETAT_MILLISECONDES = 10 * 60 * 1000;
const DELAI_TWITCH_MILLISECONDES = 10_000;

interface EtatOAuth {
  nonce: string;
  userId?: string;
}

interface UtilisateurTwitch {
  id: string;
  login: string;
  display_name: string;
  email: string;
}

@Injectable()
export class OAuthTwitchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async creerDemarrage(request: Request) {
    const clientId = this.exigerConfiguration('TWITCH_CLIENT_ID');
    const redirectUri = this.exigerConfiguration('TWITCH_REDIRECT_URI');
    const nonce = randomBytes(32).toString('base64url');
    const session = this.lireSessionOptionnelle(request);
    const state = this.jwt.sign(
      { nonce, ...(session ? { userId: session.sub } : {}) },
      { audience: AUDIENCE_ETAT, expiresIn: DUREE_ETAT },
    );
    await this.prisma.oAuthState.create({
      data: {
        nonceHash: this.empreinteNonce(nonce),
        provider: Platform.TWITCH,
        userId: session?.sub,
        expiresAt: new Date(Date.now() + DUREE_ETAT_MILLISECONDES),
      },
    });
    const url = new URL('https://id.twitch.tv/oauth2/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'user:read:email');
    url.searchParams.set('state', state);
    return { url: url.toString(), nonce };
  }

  async traiterRetour(code: string, state: string, nonceCookie: string) {
    let etat: EtatOAuth;
    try {
      etat = this.jwt.verify<EtatOAuth>(state, { audience: AUDIENCE_ETAT });
    } catch {
      throw new UnauthorizedException('État OAuth Twitch invalide ou expiré.');
    }
    if (!nonceCookie || etat.nonce !== nonceCookie) {
      throw new UnauthorizedException('État OAuth Twitch incohérent.');
    }
    const consommation = await this.prisma.oAuthState.updateMany({
      where: {
        nonceHash: this.empreinteNonce(etat.nonce),
        provider: Platform.TWITCH,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (consommation.count !== 1) {
      throw new UnauthorizedException('État OAuth Twitch déjà utilisé.');
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
                platform: Platform.TWITCH,
                externalAccountId: profil.id,
              },
            },
            include: { user: true },
          });
          if (compteLie) {
            if (etat.userId && compteLie.userId !== etat.userId) {
              throw new ConflictException(
                'Ce compte Twitch est déjà lié à un autre compte.',
              );
            }
            await transaction.linkedPlatformAccount.update({
              where: { id: compteLie.id },
              data: { oauthTokenEncrypted: credentialChiffre },
            });
            return compteLie.user;
          }

          let utilisateur = etat.userId
            ? await transaction.user.findUnique({
                where: { id: etat.userId },
              })
            : null;
          if (!utilisateur) {
            const email = profil.email.toLowerCase();
            const emailExistant = await transaction.user.findUnique({
              where: { email },
            });
            if (emailExistant) {
              throw new ConflictException(
                'Connecte-toi avec ton compte existant avant de lier Twitch.',
              );
            }
            utilisateur = await transaction.user.create({
              data: {
                email,
                pseudo: profil.display_name || profil.login,
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
              platform: Platform.TWITCH,
              externalAccountId: profil.id,
              oauthTokenEncrypted: credentialChiffre,
            },
          });
          return utilisateur;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (erreur) {
      if (!(erreur instanceof Prisma.PrismaClientKnownRequestError)) {
        throw erreur;
      }
      if (erreur.code !== 'P2002') {
        throw erreur;
      }
      const gagnant = await this.prisma.linkedPlatformAccount.findUnique({
        where: {
          platform_externalAccountId: {
            platform: Platform.TWITCH,
            externalAccountId: profil.id,
          },
        },
        include: { user: true },
      });
      if (!gagnant || (etat.userId && gagnant.userId !== etat.userId)) {
        throw new ConflictException(
          'Ce compte Twitch est déjà lié à un autre compte.',
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
    const reponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.exigerConfiguration('TWITCH_CLIENT_ID'),
        client_secret: this.exigerConfiguration('TWITCH_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.exigerConfiguration('TWITCH_REDIRECT_URI'),
      }),
      signal: AbortSignal.timeout(DELAI_TWITCH_MILLISECONDES),
    });
    if (!reponse.ok) {
      throw new UnauthorizedException('Échange OAuth Twitch refusé.');
    }
    const credentials = (await reponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string[];
      token_type: string;
    };
    if (!credentials.access_token || !Number.isFinite(credentials.expires_in)) {
      throw new UnauthorizedException('Réponse OAuth Twitch invalide.');
    }
    return credentials;
  }

  private async chargerProfil(accessToken: string): Promise<UtilisateurTwitch> {
    const reponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': this.exigerConfiguration('TWITCH_CLIENT_ID'),
      },
      signal: AbortSignal.timeout(DELAI_TWITCH_MILLISECONDES),
    });
    if (!reponse.ok) {
      throw new UnauthorizedException('Profil Twitch inaccessible.');
    }
    const corps = (await reponse.json()) as { data?: UtilisateurTwitch[] };
    const profil = corps.data?.[0];
    if (!profil?.id || !profil.email) {
      throw new UnauthorizedException(
        'Le compte Twitch ne fournit pas d’email.',
      );
    }
    return profil;
  }

  private exigerConfiguration(nom: string): string {
    const valeur = process.env[nom];
    if (!valeur) {
      throw new ServiceUnavailableException('OAuth provider is unavailable.');
    }
    return valeur;
  }

  private empreinteNonce(nonce: string): string {
    return createHash('sha256').update(nonce).digest('hex');
  }
}
