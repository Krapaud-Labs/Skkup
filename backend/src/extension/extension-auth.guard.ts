import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { empreinteJeton, PREFIXE_JETON_EXTENSION } from './jetons-extension';

/**
 * Authentifie un appel provenant d'une extension appariée.
 *
 * Garde distincte de `JwtAuthGuard` et non un simple repli dans la
 * stratégie JWT : le jeton de l'extension est opaque et vérifié en base
 * à chaque requête, ce qui est précisément ce qui le rend révocable.
 * Les deux mécanismes restent cloisonnés pour qu'un jeton d'extension
 * n'ouvre pas par accident les routes du site, et inversement.
 *
 * Le coût est une lecture indexée par requête. À raison d'un heartbeat
 * toutes les 30 secondes par session, c'est négligeable devant les
 * écritures que ce même heartbeat déclenche déjà.
 */
@Injectable()
export class ExtensionAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requete = context.switchToHttp().getRequest<Request>();
    const jeton = lireJetonPorteur(requete);
    if (!jeton) {
      throw new UnauthorizedException("Jeton d'extension absent ou invalide.");
    }

    const appariement = await this.prisma.extensionPairing.findUnique({
      where: { tokenHash: empreinteJeton(jeton) },
      select: {
        id: true,
        expireAt: true,
        revoqueAt: true,
        user: { select: { id: true, email: true } },
      },
    });

    // Révoqué ou expiré : refuser sans distinguer le motif, comme pour un
    // jeton inconnu.
    if (
      !appariement ||
      appariement.revoqueAt !== null ||
      appariement.expireAt <= new Date()
    ) {
      throw new UnauthorizedException("Jeton d'extension absent ou invalide.");
    }

    // Même forme que `request.user` posé par la stratégie JWT, pour que
    // les contrôleurs n'aient pas à connaître le mode d'authentification.
    (requete as Request & { user: unknown }).user = {
      userId: appariement.user.id,
      email: appariement.user.email,
      appariementId: appariement.id,
    };
    return true;
  }
}

/** Extrait le jeton d'extension de l'en-tête `Authorization`, s'il en porte un. */
function lireJetonPorteur(requete: Request): string | null {
  const entete = requete.headers.authorization;
  if (!entete?.startsWith('Bearer ')) {
    return null;
  }
  const valeur = entete.slice('Bearer '.length).trim();
  // Le préfixe écarte immédiatement un JWT de session web présenté ici :
  // les deux credentials ne doivent jamais être interchangeables.
  return valeur.startsWith(PREFIXE_JETON_EXTENSION) ? valeur : null;
}
