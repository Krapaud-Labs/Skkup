import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type { CreateContentDto, UpdateContentDto } from './dto/content.dto';

const projection = {
  id: true,
  slug: true,
  type: true,
  locale: true,
  status: true,
  data: true,
  version: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  lister(type?: CreateContentDto['type'], locale?: string) {
    return this.prisma.managedContent.findMany({
      where: { ...(type ? { type } : {}), ...(locale ? { locale } : {}) },
      orderBy: [{ type: 'asc' }, { slug: 'asc' }, { locale: 'asc' }],
      select: projection,
    });
  }

  publier(slug: string, type: CreateContentDto['type'], locale: string) {
    return this.prisma.managedContent.findFirst({
      where: { slug, type, locale, status: 'PUBLISHED' },
      select: projection,
    });
  }

  async creer(dto: CreateContentDto, actorId: string) {
    const existing = await this.prisma.managedContent.findUnique({
      where: {
        slug_type_locale: {
          slug: dto.slug,
          type: dto.type,
          locale: dto.locale,
        },
      },
    });
    if (existing) throw new BadRequestException('Content already exists.');
    return this.prisma.$transaction(async (tx) => {
      const data = dto.data as Prisma.InputJsonValue;
      const content = await tx.managedContent.create({
        data: {
          ...dto,
          data,
          status: 'DRAFT',
          createdById: actorId,
          updatedById: actorId,
        },
        select: projection,
      });
      await tx.contentVersion.create({
        data: {
          contentId: content.id,
          version: 1,
          data,
          status: 'DRAFT',
          createdById: actorId,
        },
      });
      await this.recordAudit(tx, actorId, 'CONTENT_CREATED', content.id, {
        type: dto.type,
        locale: dto.locale,
      });
      return content;
    });
  }

  async modifier(id: string, dto: UpdateContentDto, actorId: string) {
    const current = await this.prisma.managedContent.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Content not found.');
    return this.prisma.$transaction(async (tx) => {
      const version = current.version + 1;
      const data = dto.data as Prisma.InputJsonValue;
      const content = await tx.managedContent.update({
        where: { id },
        data: {
          data,
          version,
          status: 'DRAFT',
          publishedAt: null,
          updatedById: actorId,
        },
        select: projection,
      });
      await tx.contentVersion.create({
        data: {
          contentId: id,
          version,
          data,
          status: 'DRAFT',
          createdById: actorId,
        },
      });
      await this.recordAudit(tx, actorId, 'CONTENT_UPDATED', id, { version });
      return content;
    });
  }

  async publierVersion(id: string, actorId: string) {
    const current = await this.prisma.managedContent.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Content not found.');
    return this.prisma.$transaction(async (tx) => {
      const content = await tx.managedContent.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          updatedById: actorId,
        },
        select: projection,
      });
      await tx.contentVersion.update({
        where: {
          contentId_version: { contentId: id, version: current.version },
        },
        data: { status: 'PUBLISHED' },
      });
      await this.recordAudit(tx, actorId, 'CONTENT_PUBLISHED', id, {
        version: current.version,
      });
      return content;
    });
  }

  async depublier(id: string, actorId: string) {
    const current = await this.prisma.managedContent.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Content not found.');
    const content = await this.prisma.managedContent.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null, updatedById: actorId },
      select: projection,
    });
    await this.prisma.contentAuditEvent.create({
      data: {
        actorId,
        action: 'CONTENT_UNPUBLISHED',
        entityType: 'ManagedContent',
        entityId: id,
        metadata: { version: current.version },
      },
    });
    return content;
  }

  versions(id: string) {
    return this.prisma.contentVersion.findMany({
      where: { contentId: id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        data: true,
        status: true,
        createdById: true,
        createdAt: true,
      },
    });
  }

  async restaurer(id: string, versionId: string, actorId: string) {
    const version = await this.prisma.contentVersion.findFirst({
      where: { id: versionId, contentId: id },
    });
    if (!version) throw new NotFoundException('Content version not found.');
    return this.modifier(
      id,
      { data: version.data as Record<string, unknown> },
      actorId,
    );
  }

  audit(
    filters: { action?: string; entityType?: string; actorId?: string } = {},
  ) {
    return this.prisma.contentAuditEvent.findMany({
      where: {
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
        ...(filters.actorId ? { actorId: filters.actorId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        actorId: true,
        actor: { select: { pseudo: true, email: true } },
        createdAt: true,
      },
    });
  }

  private recordAudit(
    tx: Prisma.TransactionClient,
    actorId: string,
    action: string,
    entityId: string,
    metadata: Record<string, unknown>,
  ) {
    return tx.contentAuditEvent.create({
      data: {
        actorId,
        action,
        entityType: 'ManagedContent',
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}
