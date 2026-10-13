import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
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
 * la session web est limitée au jour courant, une révocation de droits admin doit donc
 * prendre effet à la requête suivante et non attendre l'expiration.
 */
@Injectable()
export class AdminGuard extends JwtAuthGuard {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let authentifie: Awaited<ReturnType<JwtAuthGuard['canActivate']>>;
    try {
      authentifie = await super.canActivate(context);
    } catch (erreur) {
      this.journaliserRefus(context, 'authentification invalide');
      throw erreur;
    }
    if (!authentifie) {
      this.journaliserRefus(context, 'authentification refusée');
      return false;
    }

    const requete = context.switchToHttp().getRequest<Request>();
    const utilisateur = requete.user as { userId: string } | undefined;
    if (!utilisateur?.userId) {
      this.journaliserRefus(context, 'identité absente');
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
      this.journaliserRefus(context, 'rôle insuffisant');
      throw new ForbiddenException('Accès administrateur requis.');
    }

    return true;
  }

  private journaliserRefus(context: ExecutionContext, motif: string): void {
    const requete = context.switchToHttp().getRequest<Request>();
    const route = (requete as Request & { route?: unknown }).route as
      { path?: unknown } | undefined;
    // Objet structuré plutôt qu'une ligne concaténée : une valeur issue de
    // la requête ne peut pas injecter une fausse ligne dans les journaux.
    this.logger.warn({
      evenement: 'acces_administrateur_refuse',
      motif,
      methode: requete.method ?? 'inconnue',
      // Ne jamais journaliser l’URL fournie par le client, qui peut contenir
      // un identifiant ou une valeur sensible dans un paramètre de route.
      chemin: typeof route?.path === 'string' ? route.path : 'inconnu',
      ip: requete.ip ?? 'inconnue',
    });
  }
}
