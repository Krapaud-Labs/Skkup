import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnnouncementStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAnnouncementDto } from './dto/create-announcement.dto';
import type { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import type { Prisma } from '../../generated/prisma/client';

type FenetreAnnonce = {
  debutAt?: string;
  finAt?: string;
};

type CurseurAnnonceViewer = { createdAt: Date; id: string };
type ClientTransaction = Prisma.TransactionClient;
type SnapshotAnnonce = {
  titre: string;
  texte: string;
  debutAt: string | null;
  finAt: string | null;
  status: AnnouncementStatus;
};

const TAILLE_PAGE_ANNONCES_VIEWER = 50;
const SELECT_ADMIN_ANNONCE = {
  id: true,
  titre: true,
  texte: true,
  status: true,
  actif: true,
  debutAt: true,
  finAt: true,
  createdAt: true,
} as const;

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Contrat public historique : actif et période courante restent inchangés. */
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

  /** Le viewer ne reçoit que les publications, même futures ou expirées. */
  async publieesPourViewer(cursor?: string) {
    const position =
      cursor !== undefined ? this.decoderCurseurViewer(cursor) : undefined;
    const annonces = await this.prisma.announcement.findMany({
      where: {
        status: AnnouncementStatus.PUBLISHED,
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
    return this.prisma.$transaction(async (tx) => {
      const annonce = await tx.announcement.create({
        data: {
          titre: dto.titre,
          texte: dto.texte,
          status: AnnouncementStatus.DRAFT,
          actif: false,
          debutAt: dto.debutAt ? new Date(dto.debutAt) : null,
          finAt: dto.finAt ? new Date(dto.finAt) : null,
          createdById,
        },
        select: SELECT_ADMIN_ANNONCE,
      });
      await tx.contentAuditEvent.create({
        data: {
          actorId: createdById,
          action: 'ANNOUNCEMENT_CREATED',
          entityType: 'Announcement',
          entityId: annonce.id,
          metadata: {
            titre: annonce.titre,
            status: annonce.status,
            actif: annonce.actif,
          },
        },
      });
      return annonce;
    });
  }

  async listerAdmin() {
    return this.prisma.announcement.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: SELECT_ADMIN_ANNONCE,
    });
  }

  async modifier(id: string, dto: UpdateAnnouncementDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const annonce = await this.chargerAnnonce(tx, id);
      if (annonce.status === AnnouncementStatus.ARCHIVED) {
        throw new ConflictException('Restore the announcement before editing.');
      }

      const debutAt = dto.debutAt ?? annonce.debutAt?.toISOString();
      const finAt = dto.finAt ?? annonce.finAt?.toISOString();
      this.verifierFenetre({ debutAt, finAt });

      // Legacy clients still send `actif`; translate it at this boundary.
      const nextStatus =
        dto.actif === undefined
          ? annonce.status
          : dto.actif
            ? AnnouncementStatus.PUBLISHED
            : AnnouncementStatus.ARCHIVED;
      const changes = {
        ...(dto.titre === undefined ? {} : { titre: dto.titre }),
        ...(dto.texte === undefined ? {} : { texte: dto.texte }),
        ...(dto.debutAt === undefined
          ? {}
          : { debutAt: new Date(dto.debutAt) }),
        ...(dto.finAt === undefined ? {} : { finAt: new Date(dto.finAt) }),
        status: nextStatus,
        actif: nextStatus === AnnouncementStatus.PUBLISHED,
      };
      const hasChanges =
        dto.titre !== undefined ||
        dto.texte !== undefined ||
        dto.debutAt !== undefined ||
        dto.finAt !== undefined ||
        nextStatus !== annonce.status;
      if (!hasChanges) return annonce;

      const updated = await tx.announcement.updateMany({
        where: { id, status: annonce.status },
        data: changes,
      });
      if (updated.count !== 1) {
        throw new ConflictException('Announcement changed concurrently.');
      }
      const modifiee = await this.chargerAnnonce(tx, id);
      const action =
        nextStatus === AnnouncementStatus.ARCHIVED
          ? 'ANNOUNCEMENT_ARCHIVED'
          : nextStatus === AnnouncementStatus.PUBLISHED &&
              annonce.status !== AnnouncementStatus.PUBLISHED
            ? 'ANNOUNCEMENT_PUBLISHED'
            : 'ANNOUNCEMENT_UPDATED';
      await tx.contentAuditEvent.create({
        data: {
          actorId,
          action,
          entityType: 'Announcement',
          entityId: id,
          metadata:
            action === 'ANNOUNCEMENT_ARCHIVED'
              ? {
                  previous: this.snapshot(annonce),
                  current: this.snapshot(modifiee),
                }
              : ({
                  changes: dto,
                  previous: this.snapshot(annonce),
                  current: this.snapshot(modifiee),
                } as unknown as Prisma.InputJsonValue),
        },
      });
      return modifiee;
    });
  }

  async publier(id: string, actorId: string) {
    return this.transitionner(id, actorId, AnnouncementStatus.PUBLISHED);
  }

  async supprimer(id: string, actorId: string) {
    return this.transitionner(id, actorId, AnnouncementStatus.ARCHIVED);
  }

  private async transitionner(
    id: string,
    actorId: string,
    nextStatus:
      | (typeof AnnouncementStatus)['PUBLISHED']
      | (typeof AnnouncementStatus)['ARCHIVED'],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const annonce = await this.chargerAnnonce(tx, id);
      if (annonce.status === nextStatus) return annonce;
      if (
        nextStatus === AnnouncementStatus.PUBLISHED &&
        annonce.status !== AnnouncementStatus.DRAFT
      ) {
        throw new ConflictException('Only a draft can be published.');
      }
      if (
        nextStatus === AnnouncementStatus.ARCHIVED &&
        annonce.status === AnnouncementStatus.ARCHIVED
      ) {
        return annonce;
      }

      const updated = await tx.announcement.updateMany({
        where: { id, status: annonce.status },
        data: {
          status: nextStatus,
          actif: nextStatus === AnnouncementStatus.PUBLISHED,
        },
      });
      if (updated.count !== 1) {
        const current = await this.chargerAnnonce(tx, id);
        if (current.status === nextStatus) return current;
        throw new ConflictException('Announcement changed concurrently.');
      }
      const current = await this.chargerAnnonce(tx, id);
      await tx.contentAuditEvent.create({
        data: {
          actorId,
          action:
            nextStatus === AnnouncementStatus.PUBLISHED
              ? 'ANNOUNCEMENT_PUBLISHED'
              : 'ANNOUNCEMENT_ARCHIVED',
          entityType: 'Announcement',
          entityId: id,
          metadata: {
            previous: this.snapshot(annonce),
            current: this.snapshot(current),
          },
        },
      });
      return current;
    });
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
    return this.prisma.$transaction(async (tx) => {
      const [annonce, evenement, dejaRestauree] = await Promise.all([
        this.chargerAnnonce(tx, id),
        tx.contentAuditEvent.findFirst({
          where: { id: eventId, entityType: 'Announcement', entityId: id },
        }),
        tx.contentAuditEvent.findFirst({
          where: {
            entityType: 'Announcement',
            entityId: id,
            action: 'ANNOUNCEMENT_RESTORED',
            metadata: { path: ['sourceEventId'], equals: eventId },
          },
        }),
      ]);
      if (!evenement) {
        throw new NotFoundException('Announcement history event not found.');
      }
      if (evenement.action !== 'ANNOUNCEMENT_ARCHIVED') {
        throw new ConflictException('Only an archive event can be restored.');
      }

      const metadata = evenement.metadata as {
        previous?: Partial<SnapshotAnnonce>;
        previousActiveState?: boolean;
      };
      const previous = metadata.previous;
      const restoredStatus =
        previous?.status === AnnouncementStatus.PUBLISHED ||
        (previous?.status === undefined &&
          metadata.previousActiveState === true)
          ? AnnouncementStatus.PUBLISHED
          : AnnouncementStatus.DRAFT;
      const target = {
        titre: previous?.titre ?? annonce.titre,
        texte: previous?.texte ?? annonce.texte,
        debutAt: previous?.debutAt
          ? new Date(previous.debutAt)
          : annonce.debutAt,
        finAt: previous?.finAt ? new Date(previous.finAt) : annonce.finAt,
        status: restoredStatus,
        actif: restoredStatus === AnnouncementStatus.PUBLISHED,
      };
      if (dejaRestauree) {
        if (this.correspondAInstantane(annonce, target)) return annonce;
        throw new ConflictException(
          'The announcement changed after this archive was restored.',
        );
      }
      if (annonce.status !== AnnouncementStatus.ARCHIVED) {
        throw new ConflictException(
          'Only archived announcements can be restored.',
        );
      }

      const updated = await tx.announcement.updateMany({
        where: { id, status: AnnouncementStatus.ARCHIVED },
        data: target,
      });
      if (updated.count !== 1) {
        throw new ConflictException('Announcement changed concurrently.');
      }
      const restauree = await this.chargerAnnonce(tx, id);
      await tx.contentAuditEvent.create({
        data: {
          actorId,
          action: 'ANNOUNCEMENT_RESTORED',
          entityType: 'Announcement',
          entityId: id,
          metadata: {
            sourceEventId: eventId,
            previous: this.snapshot(annonce),
            current: this.snapshot(restauree),
          },
        },
      });
      return restauree;
    });
  }

  private async chargerAnnonce(tx: ClientTransaction, id: string) {
    const annonce = await tx.announcement.findUnique({ where: { id } });
    if (!annonce) throw new NotFoundException('Announcement not found.');
    return annonce;
  }

  private snapshot(annonce: {
    titre: string;
    texte: string;
    debutAt: Date | null;
    finAt: Date | null;
    status: AnnouncementStatus;
  }): SnapshotAnnonce {
    return {
      titre: annonce.titre,
      texte: annonce.texte,
      debutAt: annonce.debutAt?.toISOString() ?? null,
      finAt: annonce.finAt?.toISOString() ?? null,
      status: annonce.status,
    };
  }

  private correspondAInstantane(
    annonce: {
      titre: string;
      texte: string;
      debutAt: Date | null;
      finAt: Date | null;
      status: AnnouncementStatus;
    },
    target: {
      titre: string;
      texte: string;
      debutAt: Date | null;
      finAt: Date | null;
      status: AnnouncementStatus;
    },
  ) {
    return (
      annonce.titre === target.titre &&
      annonce.texte === target.texte &&
      annonce.debutAt?.getTime() === target.debutAt?.getTime() &&
      annonce.finAt?.getTime() === target.finAt?.getTime() &&
      annonce.status === target.status
    );
  }

  private verifierFenetre({ debutAt, finAt }: FenetreAnnonce) {
    if (debutAt && finAt && new Date(finAt) < new Date(debutAt)) {
      throw new BadRequestException(
        "La fin d'affichage doit être postérieure au début.",
      );
    }
  }
}
