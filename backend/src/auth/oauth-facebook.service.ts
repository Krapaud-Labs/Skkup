import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { Platform, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { chiffrerCredentialOAuth } from './oauth-token-crypto';
import { extraireJetonRequete } from './strategies/jwt.strategy';

const AUDIENCE_ETAT = 'oauth-facebook-state';
const DUREE_ETAT = '10m';
const DUREE_ETAT_MILLISECONDES = 10 * 60 * 1000;
const DELAI_FACEBOOK_MILLISECONDES = 10_000;
const VERSION_GRAPH_FACEBOOK = process.env.FACEBOOK_GRAPH_VERSION ?? 'v23.0';

interface EtatOAuth {
  nonce: string;
  userId?: string;
}

interface ProfilFacebook {
  id: string;
  name?: string;
  email: string;
}

@Injectable()
export class OAuthFacebookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async creerDemarrage(request: Request) {
    const clientId = this.exigerConfiguration('FACEBOOK_CLIENT_ID');
    const redirectUri = this.exigerConfiguration('FACEBOOK_REDIRECT_URI');
    const nonce = randomBytes(32).toString('base64url');
    const session = this.lireSessionOptionnelle(request);
    const state = this.jwt.sign(
      { nonce, ...(session ? { userId: session.sub } : {}) },
      { audience: AUDIENCE_ETAT, expiresIn: DUREE_ETAT },
    );
    await this.prisma.oAuthState.create({
      data: {
        nonceHash: this.empreinteNonce(nonce),
        provider: Platform.FACEBOOK,
        userId: session?.sub,
        expiresAt: new Date(Date.now() + DUREE_ETAT_MILLISECONDES),
      },
    });

    const url = new URL(
      `https://www.facebook.com/${VERSION_GRAPH_FACEBOOK}/dialog/oauth`,
    );
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'email,public_profile');
    url.searchParams.set('state', state);
    return { url: url.toString(), nonce };
  }

  async traiterRetour(code: string, state: string, nonceCookie: string) {
    let etat: EtatOAuth;
    try {
      etat = this.jwt.verify<EtatOAuth>(state, { audience: AUDIENCE_ETAT });
    } catch {
      throw new UnauthorizedException(
        'État OAuth Facebook invalide ou expiré.',
      );
    }
    if (!nonceCookie || etat.nonce !== nonceCookie) {
      throw new UnauthorizedException('État OAuth Facebook incohérent.');
    }
    const consommation = await this.prisma.oAuthState.updateMany({
      where: {
        nonceHash: this.empreinteNonce(etat.nonce),
        provider: Platform.FACEBOOK,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (consommation.count !== 1) {
      throw new UnauthorizedException('État OAuth Facebook déjà utilisé.');
    }

    const credentials = await this.echangerCode(code);
    await this.verifierPermissions(credentials.access_token);
    const profil = await this.chargerProfil(credentials.access_token);
    const credentialChiffre = chiffrerCredentialOAuth(credentials);
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const compteLie = await transaction.linkedPlatformAccount.findUnique({
            where: {
              platform_externalAccountId: {
                platform: Platform.FACEBOOK,
                externalAccountId: profil.id,
              },
            },
            include: { user: true },
          });
          if (compteLie) {
            if (etat.userId && compteLie.userId !== etat.userId) {
              throw new ConflictException(
                'Ce compte Facebook est déjà lié à un autre compte.',
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
                'Connecte-toi avec ton compte existant avant de lier Facebook.',
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
              platform: Platform.FACEBOOK,
              externalAccountId: profil.id,
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
            platform: Platform.FACEBOOK,
            externalAccountId: profil.id,
          },
        },
        include: { user: true },
      });
      if (!gagnant || (etat.userId && gagnant.userId !== etat.userId)) {
        throw new ConflictException(
          'Ce compte Facebook est déjà lié à un autre compte.',
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
    const reponse = await fetch(
      `https://graph.facebook.com/${VERSION_GRAPH_FACEBOOK}/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.exigerConfiguration('FACEBOOK_CLIENT_ID'),
          client_secret: this.exigerConfiguration('FACEBOOK_CLIENT_SECRET'),
          redirect_uri: this.exigerConfiguration('FACEBOOK_REDIRECT_URI'),
          code,
        }),
        signal: AbortSignal.timeout(DELAI_FACEBOOK_MILLISECONDES),
      },
    );
    if (!reponse.ok) {
      throw new UnauthorizedException('Échange OAuth Facebook refusé.');
    }
    const credentials = (await reponse.json()) as {
      access_token: string;
      token_type?: string;
      expires_in?: number;
    };
    if (!credentials.access_token) {
      throw new UnauthorizedException('Réponse OAuth Facebook invalide.');
    }
    return credentials;
  }

  private async chargerProfil(accessToken: string): Promise<ProfilFacebook> {
    const url = new URL(
      `https://graph.facebook.com/${VERSION_GRAPH_FACEBOOK}/me`,
    );
    url.searchParams.set('fields', 'id,name,email');
    url.searchParams.set('appsecret_proof', this.preuveGraph(accessToken));
    const reponse = await fetch(url, {
      headers: this.entetesGraph(accessToken),
      signal: AbortSignal.timeout(DELAI_FACEBOOK_MILLISECONDES),
    });
    if (!reponse.ok) {
      throw new UnauthorizedException('Profil Facebook inaccessible.');
    }
    const profil = (await reponse.json()) as Partial<ProfilFacebook>;
    if (!profil.id || !profil.email) {
      throw new UnauthorizedException(
        'Le compte Facebook ne fournit pas d’email.',
      );
    }
    return profil as ProfilFacebook;
  }

  private async verifierPermissions(accessToken: string): Promise<void> {
    const url = new URL(
      `https://graph.facebook.com/${VERSION_GRAPH_FACEBOOK}/me/permissions`,
    );
    url.searchParams.set('appsecret_proof', this.preuveGraph(accessToken));
    const reponse = await fetch(url, {
      headers: this.entetesGraph(accessToken),
      signal: AbortSignal.timeout(DELAI_FACEBOOK_MILLISECONDES),
    });
    if (!reponse.ok) {
      throw new UnauthorizedException(
        'Permissions Facebook impossibles à vérifier.',
      );
    }
    const corps = (await reponse.json()) as {
      data?: Array<{ permission?: string; status?: string }>;
    };
    const permissions = new Set(
      corps.data
        ?.filter((permission) => permission.status === 'granted')
        .map((permission) => permission.permission),
    );
    if (
      permissions.size !== 2 ||
      !permissions.has('email') ||
      !permissions.has('public_profile')
    ) {
      throw new UnauthorizedException(
        'Permissions Facebook insuffisantes ou refusées.',
      );
    }
  }

  private entetesGraph(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  private preuveGraph(accessToken: string): string {
    return createHmac(
      'sha256',
      this.exigerConfiguration('FACEBOOK_CLIENT_SECRET'),
    )
      .update(accessToken)
      .digest('hex');
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
