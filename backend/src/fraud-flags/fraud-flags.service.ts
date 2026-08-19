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

  async modifier(id: string, dto: UpdateFraudFlagDto) {
    const flag = await this.prisma.fraudFlag.findUnique({ where: { id } });
    if (!flag)
      throw new NotFoundException('Signalement anti-fraude introuvable.');
    return this.prisma.fraudFlag.update({
      where: { id },
      data: {
        statut: dto.statut,
        examineeAt: dto.statut === FraudFlagStatus.OUVERTE ? null : new Date(),
      },
    });
  }
}
