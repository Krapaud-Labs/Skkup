import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../../generated/prisma/enums';

/**
 * Garde des routes `/admin/*`. Étend `JwtAuthGuard` plutôt que de le
 * combiner via `@UseGuards(JwtAuthGuard, AdminGuard)` : un seul décorateur
 * suffit sur chaque futur contrôleur admin, ce qui élimine le risque
 * d'oublier la garde d'authentification et de laisser passer, par
 * exemple, `ExtensionAuthGuard` sur une route sensible. Le jeton
 * d'extension n'est jamais accepté ici, uniquement le JWT de session web
 * (cookie ou en-tête `Authorization`, voir JwtStrategy).
 *
 * Le rôle est relu en base à chaque requête plutôt que porté par le JWT :
 * le jeton vit jusqu'à 7 jours, une révocation de droits admin doit donc
 * prendre effet à la requête suivante et non attendre l'expiration.
 */
@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authentifie = await super.canActivate(context);
    if (!authentifie) {
      return false;
    }

    const requete = context.switchToHttp().getRequest<Request>();
    const utilisateur = requete.user as { userId: string } | undefined;
    if (!utilisateur?.userId) {
      throw new ForbiddenException('Accès administrateur requis.');
    }

    const compte = await this.prisma.user.findUnique({
      where: { id: utilisateur.userId },
      select: { role: true },
    });

    // Refus par défaut : compte introuvable (supprimé entre l'émission
    // du JWT et cette requête) ou rôle insuffisant traités de la même
    // façon.
    if (!compte || compte.role !== Role.ADMIN) {
      throw new ForbiddenException('Accès administrateur requis.');
    }

    return true;
  }
}
