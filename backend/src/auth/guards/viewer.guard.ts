import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

type RequeteAuthentifiee = Request & { user?: { userId?: string } };

/** Autorise uniquement les sessions web rattachées à un compte VIEWER actif. */
@Injectable()
export class ViewerGuard extends JwtAuthGuard {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: import('@nestjs/common').ExecutionContext) {
    const authentifie = await super.canActivate(context);
    if (!authentifie) return false;

    const request = context.switchToHttp().getRequest<RequeteAuthentifiee>();
    const utilisateur = request.user;
    if (!utilisateur?.userId) {
      throw new ForbiddenException('Accès viewer requis.');
    }

    const compte = await this.prisma.user.findUnique({
      where: { id: utilisateur.userId },
      select: { role: true },
    });
    if (!compte || compte.role !== Role.VIEWER) {
      throw new ForbiddenException('Accès viewer requis.');
    }

    return true;
  }
}
