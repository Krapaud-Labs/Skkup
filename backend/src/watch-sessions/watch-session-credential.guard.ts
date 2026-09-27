import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExtensionAuthGuard } from '../extension/extension-auth.guard';
import { PREFIXE_JETON_EXTENSION } from '../extension/jetons-extension';
import { WatchSessionSource } from '../../generated/prisma/enums';

interface RequeteAvecUtilisateur extends Request {
  user?: { userId: string; email: string; source?: WatchSessionSource };
}

/**
 * Garde combinée des routes de visionnage : accepte soit la session web
 * (cookie, via `JwtAuthGuard`), soit le jeton d'une extension appariée
 * (en-tête `Authorization: Bearer vrx_...`, via `ExtensionAuthGuard`).
 *
 * La source `WatchSessionSource` posée sur `request.user` est déduite du
 * credential qui a effectivement authentifié la requête, jamais d'un
 * champ envoyé par le client : c'est ce qui permet à `WatchSessionsService`
 * de réserver le crédit de points à la source `EXTENSION` sans jamais
 * faire confiance au payload. Les deux mécanismes d'authentification
 * restent cloisonnés (aucun jeton ne peut se faire passer pour l'autre),
 * exactement comme documenté pour `ExtensionAuthGuard` seule.
 */
@Injectable()
export class WatchSessionCredentialGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly extensionAuthGuard: ExtensionAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requete = context.switchToHttp().getRequest<RequeteAvecUtilisateur>();

    // Le choix de la garde à déléguer se fait sur le préfixe du jeton
    // porteur, jamais sur une déclaration du client : un jeton `vrx_`
    // ne peut provenir que d'un appariement d'extension valide, un JWT
    // de session web ne porte jamais ce préfixe.
    if (porteJetonExtension(requete)) {
      const autorise = await resoudre(
        this.extensionAuthGuard.canActivate(context),
      );
      return this.poserSource(requete, autorise, WatchSessionSource.EXTENSION);
    }

    const autorise = await resoudre(this.jwtAuthGuard.canActivate(context));
    return this.poserSource(
      requete,
      autorise,
      WatchSessionSource.LECTEUR_EMBARQUE,
    );
  }

  /**
   * Une garde qui autorise sans avoir posé `request.user` laisserait
   * passer une requête sans source ni identité : on refuse alors plutôt
   * que de laisser le contrôleur travailler sur une source indéfinie.
   * Aucune des deux gardes déléguées ne le fait aujourd'hui, la
   * vérification est là pour que ce contrat reste fermé par défaut si
   * l'une d'elles change.
   */
  private poserSource(
    requete: RequeteAvecUtilisateur,
    autorise: boolean,
    source: WatchSessionSource,
  ): boolean {
    if (!autorise) {
      return false;
    }
    if (!requete.user) {
      throw new UnauthorizedException('Authentication is required.');
    }
    requete.user.source = source;
    return true;
  }
}

function porteJetonExtension(requete: Request): boolean {
  const entete = requete.headers.authorization;
  return (
    typeof entete === 'string' &&
    entete.startsWith(`Bearer ${PREFIXE_JETON_EXTENSION}`)
  );
}

/**
 * Ramène le résultat d'un `CanActivate` délégué (booléen, promesse ou
 * observable, les trois formes admises par l'interface Nest) à une
 * simple promesse booléenne. Les deux gardes déléguées ici ne renvoient
 * en pratique jamais d'observable, mais le type de l'interface l'admet.
 */
function resoudre(
  resultat: boolean | Promise<boolean> | Observable<boolean>,
): Promise<boolean> {
  if (isObservable(resultat)) {
    return firstValueFrom(resultat);
  }
  return Promise.resolve(resultat);
}
