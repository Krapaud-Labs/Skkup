import { Injectable } from '@nestjs/common';
import {
  FraudFlagStatus,
  ManagedContentStatus,
  RaffleStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ACTIVITY = 8;

/**
 * Lecture bornée du cockpit admin. Les compteurs sont exécutés en parallèle
 * et les événements sont limités côté base pour éviter une réponse non
 * bornée. Les données sensibles (hash, mot de passe, tokens) ne sont jamais
 * sélectionnées.
 */
@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      users,
      activeUsers,
      openRaffles,
      publishedContent,
      activeAnnouncements,
      openFraudFlags,
      activeStreams,
      availableLots,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { actif: true } }),
      this.prisma.raffle.count({ where: { statut: RaffleStatus.OUVERT } }),
      this.prisma.managedContent.count({
        where: { status: ManagedContentStatus.PUBLISHED },
      }),
      this.prisma.announcement.count({ where: { actif: true } }),
      this.prisma.fraudFlag.count({ where: { statut: FraudFlagStatus.OUVERTE } }),
      this.prisma.stream.count({ where: { actif: true } }),
      this.prisma.raffleLot.count({ where: { raffle: { statut: RaffleStatus.OUVERT } } }),
      this.prisma.contentAuditEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: MAX_ACTIVITY,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          actor: { select: { id: true, pseudo: true } },
        },
      }),
    ]);

    return {
      counts: {
        users,
        activeUsers,
        openRaffles,
        publishedContent,
        activeAnnouncements,
        openFraudFlags,
        activeStreams,
      },
      recentActivity,
    };
  }
}
