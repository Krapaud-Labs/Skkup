import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAnnouncementDto } from './dto/create-announcement.dto';
import type { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import type { Prisma } from '../../generated/prisma/client';

type FenetreAnnonce = {
  debutAt?: string;
  finAt?: string;
};

type CurseurAnnonceViewer = { createdAt: Date; id: string };

const TAILLE_PAGE_ANNONCES_VIEWER = 50;

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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        titre: true,
        texte: true,
        debutAt: true,
        finAt: true,
      },
    });
  }

  async publieesPourViewer(cursor?: string) {
    const position =
      cursor !== undefined ? this.decoderCurseurViewer(cursor) : undefined;
    const annonces = await this.prisma.announcement.findMany({
      where: {
        actif: true,
        ...(position && {
          OR: [
            { createdAt: { lt: position.createdAt } },
            { createdAt: position.createdAt, id: { lt: position.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: TAILLE_PAGE_ANNONCES_VIEWER + 1,
      select: {
        id: true,
        titre: true,
        texte: true,
        createdAt: true,
      },
    });

    const page = annonces.slice(0, TAILLE_PAGE_ANNONCES_VIEWER);
    const derniereAnnonce = page.at(-1);
    const hasNextPage = annonces.length > TAILLE_PAGE_ANNONCES_VIEWER;

    return {
      items: page.map(({ id, titre, texte }) => ({ id, titre, texte })),
      nextCursor:
        hasNextPage && derniereAnnonce
          ? this.encoderCurseurViewer(derniereAnnonce)
          : null,
    };
  }

  private encoderCurseurViewer(position: CurseurAnnonceViewer): string {
    return Buffer.from(
      JSON.stringify({
        createdAt: position.createdAt.toISOString(),
        id: position.id,
      }),
    ).toString('base64url');
  }

  private decoderCurseurViewer(cursor: string): CurseurAnnonceViewer {
    try {
      if (
        cursor.length === 0 ||
        cursor.length > 1024 ||
        !/^[A-Za-z0-9_-]+$/.test(cursor) ||
        Buffer.from(cursor, 'base64url').toString('base64url') !== cursor
      ) {
        throw new Error('Invalid cursor encoding');
      }

      const decoded: unknown = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      );
      if (
        typeof decoded !== 'object' ||
        decoded === null ||
        !('createdAt' in decoded) ||
        !('id' in decoded) ||
        Object.keys(decoded).length !== 2 ||
        typeof decoded.createdAt !== 'string' ||
        typeof decoded.id !== 'string' ||
        decoded.id.length === 0 ||
        decoded.id.length > 128
      ) {
        throw new Error('Invalid cursor payload');
      }

      const createdAt = new Date(decoded.createdAt);
      if (
        Number.isNaN(createdAt.getTime()) ||
        createdAt.toISOString() !== decoded.createdAt
      ) {
        throw new Error('Invalid cursor date');
      }
      return { createdAt, id: decoded.id };
    } catch {
      throw new BadRequestException('Invalid announcement cursor.');
    }
  }

  async creer(dto: CreateAnnouncementDto, createdById: string) {
    this.verifierFenetre(dto);
    const annonce = await this.prisma.announcement.create({
      data: {
        titre: dto.titre,
        texte: dto.texte,
        debutAt: dto.debutAt ? new Date(dto.debutAt) : null,
        finAt: dto.finAt ? new Date(dto.finAt) : null,
        createdById,
      },
      select: {
        id: true,
        titre: true,
        texte: true,
        actif: true,
        debutAt: true,
        finAt: true,
        createdAt: true,
      },
    });
    await this.prisma.contentAuditEvent.create({
      data: {
        actorId: createdById,
        action: 'ANNOUNCEMENT_CREATED',
        entityType: 'Announcement',
        entityId: annonce.id,
        metadata: {
          titre: annonce.titre,
          actif: annonce.actif,
        },
      },
    });
    return annonce;
  }

  async listerAdmin() {
    return this.prisma.announcement.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        titre: true,
        texte: true,
        actif: true,
        debutAt: true,
        finAt: true,
        createdAt: true,
      },
    });
  }

  async modifier(id: string, dto: UpdateAnnouncementDto, actorId: string) {
    const annonce = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!annonce) throw new NotFoundException('Annonce introuvable.');

    const debutAt = dto.debutAt ?? annonce.debutAt?.toISOString();
    const finAt = dto.finAt ?? annonce.finAt?.toISOString();
    this.verifierFenetre({ debutAt, finAt });

    const modifiee = await this.prisma.announcement.update({
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
    await this.prisma.contentAuditEvent.create({
      data: {
        actorId,
        action: 'ANNOUNCEMENT_UPDATED',
        entityType: 'Announcement',
        entityId: id,
        metadata: {
          changes: dto,
          previous: {
            titre: annonce.titre,
            texte: annonce.texte,
            actif: annonce.actif,
            debutAt: annonce.debutAt?.toISOString() ?? null,
            finAt: annonce.finAt?.toISOString() ?? null,
          },
          current: {
            titre: modifiee.titre,
            texte: modifiee.texte,
            actif: modifiee.actif,
            debutAt: modifiee.debutAt?.toISOString() ?? null,
            finAt: modifiee.finAt?.toISOString() ?? null,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
    return modifiee;
  }

  async supprimer(id: string, actorId: string) {
    const annonce = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!annonce) throw new NotFoundException('Announcement not found.');
    const archivee = await this.prisma.announcement.update({
      where: { id },
      data: { actif: false },
    });
    await this.prisma.contentAuditEvent.create({
      data: {
        actorId,
        action: 'ANNOUNCEMENT_ARCHIVED',
        entityType: 'Announcement',
        entityId: id,
        metadata: {
          titre: annonce.titre,
          previousActiveState: annonce.actif,
        },
      },
    });
    return archivee;
  }

  historique(id: string) {
    return this.prisma.contentAuditEvent.findMany({
      where: { entityType: 'Announcement', entityId: id },
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

  async restaurer(id: string, eventId: string, actorId: string) {
    const [annonce, evenement] = await Promise.all([
      this.prisma.announcement.findUnique({ where: { id } }),
      this.prisma.contentAuditEvent.findFirst({
        where: { id: eventId, entityType: 'Announcement', entityId: id },
      }),
    ]);
    if (!annonce) throw new NotFoundException('Announcement not found.');
    if (!evenement)
      throw new NotFoundException('Announcement history event not found.');
    const metadata = evenement.metadata as {
      previous?: Partial<
        Pick<typeof annonce, 'titre' | 'texte' | 'actif' | 'debutAt' | 'finAt'>
      >;
    };
    const previous = metadata.previous;
    if (!previous?.titre || !previous.texte) {
      throw new BadRequestException('This history event cannot be restored.');
    }
    const restauree = await this.prisma.announcement.update({
      where: { id },
      data: {
        titre: previous.titre,
        texte: previous.texte,
        actif: previous.actif ?? false,
        debutAt: previous.debutAt ? new Date(previous.debutAt) : null,
        finAt: previous.finAt ? new Date(previous.finAt) : null,
      },
    });
    await this.prisma.contentAuditEvent.create({
      data: {
        actorId,
        action: 'ANNOUNCEMENT_RESTORED',
        entityType: 'Announcement',
        entityId: id,
        metadata: { sourceEventId: eventId },
      },
    });
    return restauree;
  }

  private verifierFenetre({ debutAt, finAt }: FenetreAnnonce) {
    if (debutAt && finAt && new Date(finAt) < new Date(debutAt)) {
      throw new BadRequestException(
        "La fin d'affichage doit être postérieure au début.",
      );
    }
  }
}
