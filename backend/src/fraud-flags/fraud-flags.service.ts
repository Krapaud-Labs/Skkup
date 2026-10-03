import { Injectable, NotFoundException } from '@nestjs/common';
import { FraudFlagStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateFraudFlagDto } from './dto/update-fraud-flag.dto';

@Injectable()
export class FraudFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  lister(statut?: FraudFlagStatus) {
    return this.prisma.fraudFlag.findMany({
      where: statut ? { statut } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, pseudo: true, email: true } },
        watchSession: {
          select: {
            id: true,
            platform: true,
            streamExternalId: true,
            statut: true,
          },
        },
      },
    });
  }

  async detail(id: string) {
    const flag = await this.prisma.fraudFlag.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, pseudo: true, email: true, role: true, actif: true, createdAt: true } },
        watchSession: { select: { id: true, platform: true, streamExternalId: true, statut: true } },
      },
    });
    if (!flag) throw new NotFoundException('Signalement anti-fraude introuvable.');
    const audit = await this.prisma.contentAuditEvent.findMany({
      where: { entityType: 'FraudFlag', entityId: id }, orderBy: { createdAt: 'asc' },
      include: { actor: { select: { pseudo: true, email: true } } },
    });
    return { ...flag, audit };
  }

  async modifier(id: string, dto: UpdateFraudFlagDto, actorId: string) {
    const flag = await this.prisma.fraudFlag.findUnique({ where: { id } });
    if (!flag)
      throw new NotFoundException('Signalement anti-fraude introuvable.');
    const updated = await this.prisma.fraudFlag.update({
      where: { id },
      data: {
        statut: dto.statut,
        examineeAt: dto.statut === FraudFlagStatus.OUVERTE ? null : new Date(),
      },
    });
    await this.prisma.contentAuditEvent.create({
      data: {
        actorId,
        action: 'FRAUD_FLAG_STATUS_UPDATED',
        entityType: 'FraudFlag',
        entityId: id,
        metadata: { statut: dto.statut, ...(dto.note?.trim() ? { note: dto.note.trim() } : {}) },
      },
    });
    return updated;
  }
}
