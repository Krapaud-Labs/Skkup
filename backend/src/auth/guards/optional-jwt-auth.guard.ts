import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Variante tolérante du garde JWT pour les endpoints qui décrivent l'état
 * de session sans transformer une visite anonyme en erreur 401.
 */
@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return Boolean(await super.canActivate(context));
    } catch {
      return true;
    }
  }
}
