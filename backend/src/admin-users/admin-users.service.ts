import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateUserStatusDto } from './dto/update-user-status.dto';

function masquerEmail(email: string): string {
  const [local, domaine] = email.split('@');
  if (!local || !domaine) return '••••';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'•'.repeat(Math.max(2, local.length - visible.length))}@${domaine}`;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(search?: string) {
    const terme = search?.trim();
    return this.prisma.user.findMany({
      where: terme
        ? {
            OR: [
              { pseudo: { contains: terme, mode: 'insensitive' } },
              { email: { contains: terme, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        pseudo: true,
        email: true,
        role: true,
        actif: true,
        soldePoints: true,
        streakActuel: true,
        createdAt: true,
        _count: { select: { raffleTickets: true, watchSessions: true } },
      },
    }).then((users) => users.map(({ email, ...user }) => ({ ...user, email: masquerEmail(email) })));
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        pseudo: true,
        email: true,
        role: true,
        actif: true,
        soldePoints: true,
        streakActuel: true,
        streakMax: true,
        derniereVisiteAt: true,
        createdAt: true,
        _count: {
          select: {
            raffleTickets: true,
            watchSessions: true,
            pointsTransactions: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    const { email, ...detail } = user;
    return { ...detail, email: masquerEmail(email) };
  }

  async modifierStatut(id: string, dto: UpdateUserStatusDto, actorId: string) {
    if (id === actorId && !dto.actif)
      throw new ConflictException(
        'Un administrateur ne peut pas désactiver sa propre session.',
      );
    const current = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, actif: true },
    });
    if (!current) throw new NotFoundException('Utilisateur introuvable.');
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        actif: dto.actif,
        ...(dto.actif ? {} : { sessionVersion: { increment: 1 } }),
      },
      select: { id: true, pseudo: true, role: true, actif: true },
    });
    await this.prisma.contentAuditEvent.create({
      data: {
        actorId,
        action: dto.actif ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: id,
        metadata: { previousActif: current.actif, actif: dto.actif },
      },
    });
    return user;
  }

  historique(id: string) {
    return this.prisma.contentAuditEvent.findMany({
      where: { entityType: 'User', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        metadata: true,
        actorId: true,
        createdAt: true,
      },
    });
  }
}
