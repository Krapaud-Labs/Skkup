import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSponsorDto } from './dto/create-sponsor.dto';
import type { UpdateSponsorDto } from './dto/update-sponsor.dto';

@Injectable()
export class SponsorsService {
  constructor(private readonly prisma: PrismaService) {}

  lister() {
    return this.prisma.sponsor.findMany({
      orderBy: { nom: 'asc' },
      include: { _count: { select: { lots: true } } },
    });
  }

  async creer(dto: CreateSponsorDto, actorId: string) {
    const sponsor = await this.prisma.sponsor.create({ data: dto });
    await this.audit(actorId, 'SPONSOR_CREATED', sponsor.id, { nom: dto.nom });
    return sponsor;
  }

  async modifier(id: string, dto: UpdateSponsorDto, actorId: string) {
    const sponsor = await this.prisma.sponsor.findUnique({ where: { id } });
    if (!sponsor) throw new NotFoundException('Sponsor introuvable.');
    const updated = await this.prisma.sponsor.update({
      where: { id },
      data: dto,
    });
    await this.audit(actorId, 'SPONSOR_UPDATED', id, { changes: dto });
    return updated;
  }

  private audit(
    actorId: string,
    action: string,
    entityId: string,
    metadata: object,
  ) {
    return this.prisma.contentAuditEvent.create({
      data: { actorId, action, entityType: 'Sponsor', entityId, metadata },
    });
  }
}
