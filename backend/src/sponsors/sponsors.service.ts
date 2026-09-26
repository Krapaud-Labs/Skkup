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

  creer(dto: CreateSponsorDto) {
    return this.prisma.sponsor.create({ data: dto });
  }

  async modifier(id: string, dto: UpdateSponsorDto) {
    const sponsor = await this.prisma.sponsor.findUnique({ where: { id } });
    if (!sponsor) throw new NotFoundException('Sponsor not found.');
    return this.prisma.sponsor.update({ where: { id }, data: dto });
  }
}
