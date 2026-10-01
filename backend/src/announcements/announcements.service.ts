import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAnnouncementDto } from './dto/create-announcement.dto';
import type { UpdateAnnouncementDto } from './dto/update-announcement.dto';

type FenetreAnnonce = {
  debutAt?: string;
  finAt?: string;
};

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async actives(now = new Date()) {
    return this.prisma.announcement.findMany({
      where: {
        actif: true,
        AND: [
          { OR: [{ debutAt: null }, { debutAt: { lte: now } }] },
          { OR: [{ finAt: null }, { finAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        titre: true,
        texte: true,
        debutAt: true,
        finAt: true,
      },
    });
  }

  async creer(dto: CreateAnnouncementDto, createdById: string) {
    this.verifierFenetre(dto);
    return this.prisma.announcement.create({
      data: {
        titre: dto.titre,
        texte: dto.texte,
        debutAt: dto.debutAt ? new Date(dto.debutAt) : null,
        finAt: dto.finAt ? new Date(dto.finAt) : null,
        createdById,
      },
    });
  }

  async modifier(id: string, dto: UpdateAnnouncementDto) {
    const annonce = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!annonce) throw new NotFoundException('Announcement not found.');

    const debutAt = dto.debutAt ?? annonce.debutAt?.toISOString();
    const finAt = dto.finAt ?? annonce.finAt?.toISOString();
    this.verifierFenetre({ debutAt, finAt });

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.titre === undefined ? {} : { titre: dto.titre }),
        ...(dto.texte === undefined ? {} : { texte: dto.texte }),
        ...(dto.actif === undefined ? {} : { actif: dto.actif }),
        ...(dto.debutAt === undefined
          ? {}
          : { debutAt: new Date(dto.debutAt) }),
        ...(dto.finAt === undefined ? {} : { finAt: new Date(dto.finAt) }),
      },
    });
  }

  private verifierFenetre({ debutAt, finAt }: FenetreAnnonce) {
    if (debutAt && finAt && new Date(finAt) < new Date(debutAt)) {
      throw new BadRequestException('The display end must be after the start.');
    }
  }
}
