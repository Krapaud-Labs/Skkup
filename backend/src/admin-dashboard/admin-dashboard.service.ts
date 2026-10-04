import { Injectable } from '@nestjs/common';
import {
  FraudFlagStatus,
  ManagedContentStatus,
  RaffleStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ACTIVITY = 8;
const MAX_ROWS = 5;

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
      raffles,
      lots,
      announcements,
      fraudFlags,
      contents,
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
      this.prisma.raffle.findMany({
        where: { statut: RaffleStatus.OUVERT }, orderBy: { dateTirage: 'asc' }, take: MAX_ROWS,
        select: { id: true, titre: true, dateTirage: true, statut: true, _count: { select: { tickets: true } } },
      }),
      this.prisma.raffleLot.findMany({
        where: { raffle: { statut: RaffleStatus.OUVERT } }, take: MAX_ROWS,
        select: {
          id: true,
          nom: true,
          quantite: true,
          valeurEstimee: true,
          imageUrl: true,
          raffle: { select: { titre: true } },
        },
      }),
      this.prisma.announcement.findMany({
        where: { actif: true }, orderBy: { createdAt: 'desc' }, take: MAX_ROWS,
        select: { id: true, titre: true, actif: true, debutAt: true, finAt: true },
      }),
      this.prisma.fraudFlag.findMany({
        where: { statut: FraudFlagStatus.OUVERTE }, orderBy: { createdAt: 'desc' }, take: MAX_ROWS,
        select: { id: true, type: true, createdAt: true, user: { select: { pseudo: true } } },
      }),
      this.prisma.managedContent.findMany({
        where: { status: ManagedContentStatus.PUBLISHED }, orderBy: { updatedAt: 'desc' }, take: MAX_ROWS,
        select: { id: true, slug: true, locale: true, status: true, version: true },
      }),
    ]);

    return {
      counts: {
        users,
        activeUsers,
        openRaffles,
        availableLots,
        publishedContent,
        activeAnnouncements,
        openFraudFlags,
        activeStreams,
      },
      recentActivity,
      raffles,
      lots,
      announcements,
      fraudFlags,
      contents,
    };
  }
}
