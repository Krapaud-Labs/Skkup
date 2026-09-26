import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { nomCookieSession } from '../auth/cookie-session';
import { origineDeclaree } from './cors';

// Seules les méthodes qui modifient un état sont contrôlées : une
// lecture cross-site reste de toute façon illisible pour l'attaquant,
// le CORS bloquant l'accès à la réponse.
const METHODES_MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Protection CSRF.
 *
 * `SameSite=Lax` raisonne au niveau du site enregistrable : tout
 * sous-domaine de l'application est considéré same-site et pourrait donc
 * émettre des requêtes mutantes accompagnées du cookie de session (page
 * marketing compromise, préproduction sans authentification, CNAME
 * abandonné). Le CORS empêche l'attaquant de lire la réponse, pas la
 * requête d'être exécutée : sans ce contrôle, une carte à gratter ou un
 * ticket de tirage pourrait être consommé à l'insu de la victime.
 *
 * Le contrôle se déclenche sur la présence du cookie, jamais sur
 * l'absence d'en-tête `Authorization` : un attaquant ajouterait sinon un
 * en-tête bidon pour le désactiver pendant que le cookie authentifie
 * réellement la requête. Les clients porteurs (extension navigateur)
 * n'envoient pas le cookie et passent donc sans friction.
 */
@Injectable()
export class VerificationOrigineGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // La poignée de main WebSocket a sa propre vérification d'origine,
    // assurée par Socket.io à partir de la même liste.
    if (context.getType() !== 'http') {
      return true;
    }

    const requete = context.switchToHttp().getRequest<Request>();
    if (!METHODES_MUTANTES.has(requete.method.toUpperCase())) {
      return true;
    }

    const cookies = requete.cookies as Record<string, unknown> | undefined;
    const jeton = cookies?.[nomCookieSession()];
    if (typeof jeton !== 'string' || jeton.length === 0) {
      return true;
    }

    // Comparaison sur l'origine complète (schéma, hôte et port). Une
    // origine absente est refusée : accepter un repli sur `Referer` se
    // contournerait avec un `Referrer-Policy: no-referrer`.
    if (!origineDeclaree(requete.headers.origin)) {
      throw new ForbiddenException('Request origin is not allowed.');
    }

    return true;
  }
}
