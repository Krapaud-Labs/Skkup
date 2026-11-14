import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  PointsTransactionType,
  RaffleStatus,
  ShopDigitalCodeStatus,
  ShopItemType,
  ShopPurchaseStatus,
} from '../../generated/prisma/enums';
import { Prisma } from '../../generated/prisma/client';
import type { Prisma as PrismaTypes } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { ImportShopCodesDto } from './dto/import-shop-codes.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';
import { chiffrerCode, dechiffrerCode } from './shop-code-crypto';

const LIMITE_PAGE_DEFAUT = 20;
const LIMITE_PAGE_MAX = 100;
const TENTATIVES_TRANSACTION = 3;

type AchatAvecRelations = PrismaTypes.ShopPurchaseGetPayload<{
  include: { digitalCode: true; raffleTicket: true };
}>;

type ClientTransactionnel = PrismaTypes.TransactionClient;

interface CatalogueItem {
  id: string;
  type: ShopItemType;
  nom: string;
  description: string;
  imageUrl: string | null;
  costPoints: number;
  maxPerUser: number | null;
  active: boolean;
  raffleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  raffle?: {
    id: string;
    titre: string;
    statut: RaffleStatus;
    dateOuverture?: Date;
    dateTirage?: Date;
  } | null;
}

function pagination(pageRaw?: string, limitRaw?: string) {
  const pageParsed = Number(pageRaw ?? 1);
  const limitParsed = Number(limitRaw ?? LIMITE_PAGE_DEFAUT);
  const page = Number.isFinite(pageParsed)
    ? Math.max(1, Math.floor(pageParsed))
    : 1;
  const limit = Number.isFinite(limitParsed)
    ? Math.min(LIMITE_PAGE_MAX, Math.max(1, Math.floor(limitParsed)))
    : LIMITE_PAGE_DEFAUT;
  return { page, limit, skip: (page - 1) * limit };
}

function achatPublic(achat: AchatAvecRelations) {
  return {
    id: achat.id,
    itemType: achat.itemType,
    itemName: achat.itemName,
    costPoints: achat.costPoints,
    status: achat.status,
    createdAt: achat.createdAt,
    raffleTicketId: achat.raffleTicket?.id,
  };
}

function isSerializationConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2034'
  );
}

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async listerCatalogue(userId: string, pageRaw?: string, limitRaw?: string) {
    const { page, limit, skip } = pagination(pageRaw, limitRaw);
    const maintenant = new Date();
    const where: PrismaTypes.ShopItemWhereInput = {
      active: true,
      OR: [
        { type: { not: ShopItemType.RAFFLE_TICKET } },
        {
          type: ShopItemType.RAFFLE_TICKET,
          raffle: {
            is: {
              statut: RaffleStatus.OUVERT,
              dateOuverture: { lte: maintenant },
              dateTirage: { gt: maintenant },
            },
          },
        },
      ],
    };
    const [itemsBruts, total] = await Promise.all([
      this.prisma.shopItem.findMany({
        where,
        include: {
          raffle: {
            select: {
              id: true,
              titre: true,
              statut: true,
              dateOuverture: true,
              dateTirage: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.shopItem.count({ where }),
    ]);
    const items = itemsBruts;
    const ids = items.map(({ id }) => id);
    const [codes, achats] = await Promise.all([
      this.prisma.shopDigitalCode.groupBy({
        by: ['shopItemId'],
        where: {
          shopItemId: { in: ids },
          status: ShopDigitalCodeStatus.AVAILABLE,
        },
        _count: { id: true },
      }),
      this.prisma.shopPurchase.groupBy({
        by: ['shopItemId'],
        where: { userId, shopItemId: { in: ids } },
        _count: { id: true },
      }),
    ]);
    const stockParItem = new Map(
      codes.map((row) => [row.shopItemId, row._count.id]),
    );
    const achatsParItem = new Map(
      achats.map((row) => [row.shopItemId, row._count.id]),
    );
    return {
      items: items.map((item) => ({
        ...this.vueItem(item),
        availableQuantity:
          item.type === ShopItemType.RAFFLE_TICKET
            ? null
            : (stockParItem.get(item.id) ?? 0),
        remainingForUser:
          item.maxPerUser === null
            ? null
            : Math.max(0, item.maxPerUser - (achatsParItem.get(item.id) ?? 0)),
      })),
      total,
      page,
      limit,
    };
  }

  async acheter(userId: string, itemId: string, idempotencyKey: string) {
    if (!idempotencyKey.trim()) {
      throw new BadRequestException('Une clé d’idempotence est requise.');
    }
    for (
      let tentative = 0;
      tentative < TENTATIVES_TRANSACTION;
      tentative += 1
    ) {
      try {
        const resultat = await this.prisma.$transaction(
          async (tx) => {
            const existant = await tx.shopPurchase.findUnique({
              where: {
                userId_idempotencyKey: { userId, idempotencyKey },
              },
              include: { digitalCode: true, raffleTicket: true },
            });
            if (existant) {
              if (existant.shopItemId !== itemId) {
                throw new ConflictException(
                  'Cette clé d’achat a déjà été utilisée pour un autre article.',
                );
              }
              const compte = await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: { soldePoints: true },
              });
              return {
                purchase: achatPublic(existant),
                costPoints: existant.costPoints,
                soldePoints: compte.soldePoints,
              };
            }

            if (!(await this.verrouillerArticle(tx, itemId))) {
              throw new NotFoundException('Article indisponible.');
            }

            const item = await tx.shopItem.findUnique({
              where: { id: itemId },
              include: { raffle: true },
            });
            if (!item || !item.active) {
              throw new NotFoundException('Article indisponible.');
            }
            const maintenant = new Date();
            if (item.type === ShopItemType.RAFFLE_TICKET) {
              if (
                !item.raffle ||
                item.raffle.statut !== RaffleStatus.OUVERT ||
                item.raffle.dateOuverture > maintenant ||
                item.raffle.dateTirage <= maintenant
              ) {
                throw new ConflictException(
                  'Ce tirage n’accepte plus de tickets.',
                );
              }
            } else if (item.raffleId) {
              throw new ConflictException(
                'Un article numérique ne peut pas être associé à un tirage.',
              );
            }

            if (item.maxPerUser !== null) {
              const dejaAchetes = await tx.shopPurchase.count({
                where: { userId, shopItemId: itemId },
              });
              if (dejaAchetes >= item.maxPerUser) {
                throw new ConflictException(
                  'La limite d’achat de cet article est atteinte.',
                );
              }
            }

            const debit = await tx.user.updateMany({
              where: { id: userId, soldePoints: { gte: item.costPoints } },
              data: { soldePoints: { decrement: item.costPoints } },
            });
            if (debit.count !== 1) {
              throw new UnprocessableEntityException(
                'Le solde de points est insuffisant.',
              );
            }

            const typeTicket = item.type === ShopItemType.RAFFLE_TICKET;
            const achat = await tx.shopPurchase.create({
              data: {
                userId,
                shopItemId: item.id,
                idempotencyKey,
                itemType: item.type,
                itemName: item.nom,
                costPoints: item.costPoints,
                status: typeTicket
                  ? ShopPurchaseStatus.FULFILLED
                  : ShopPurchaseStatus.READY_TO_REVEAL,
              },
            });

            let ticketId: string | undefined;
            if (typeTicket) {
              const ticket = await tx.raffleTicket.create({
                data: {
                  raffleId: item.raffleId!,
                  userId,
                  shopPurchaseId: achat.id,
                },
                select: { id: true },
              });
              ticketId = ticket.id;
            } else {
              const candidatCodes = await tx.shopDigitalCode.findMany({
                where: {
                  shopItemId: item.id,
                  status: ShopDigitalCodeStatus.AVAILABLE,
                  purchaseId: null,
                },
                select: { id: true },
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
                take: 5,
              });
              let reserve = false;
              for (const candidat of candidatCodes) {
                const miseAJour = await tx.shopDigitalCode.updateMany({
                  where: {
                    id: candidat.id,
                    status: ShopDigitalCodeStatus.AVAILABLE,
                    purchaseId: null,
                  },
                  data: {
                    status: ShopDigitalCodeStatus.ASSIGNED,
                    purchaseId: achat.id,
                    assignedAt: maintenant,
                  },
                });
                if (miseAJour.count === 1) {
                  reserve = true;
                  break;
                }
              }
              if (!reserve) {
                throw new ConflictException(
                  'Le stock de cet article est épuisé.',
                );
              }
            }

            await tx.pointsTransaction.create({
              data: {
                userId,
                type: PointsTransactionType.SHOP_PURCHASE,
                montant: -item.costPoints,
                shopPurchaseId: achat.id,
              },
            });
            const compte = await tx.user.findUniqueOrThrow({
              where: { id: userId },
              select: { soldePoints: true },
            });
            return {
              purchase: {
                ...achatPublic({
                  ...achat,
                  digitalCode: null,
                  raffleTicket: ticketId ? { id: ticketId } : null,
                } as AchatAvecRelations),
              },
              costPoints: item.costPoints,
              soldePoints: compte.soldePoints,
            };
          },
          { isolationLevel: 'Serializable' },
        );
        return resultat;
      } catch (error) {
        if (
          isSerializationConflict(error) &&
          tentative + 1 < TENTATIVES_TRANSACTION
        ) {
          continue;
        }
        if (isUniqueConflict(error)) {
          const existant = await this.prisma.shopPurchase.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey } },
            include: { digitalCode: true, raffleTicket: true },
          });
          if (existant?.shopItemId === itemId) {
            const compte = await this.prisma.user.findUniqueOrThrow({
              where: { id: userId },
              select: { soldePoints: true },
            });
            return {
              purchase: achatPublic(existant),
              costPoints: existant.costPoints,
              soldePoints: compte.soldePoints,
            };
          }
        }
        throw error;
      }
    }
    throw new ConflictException('L’achat est en cours de conflit; réessaie.');
  }

  async mesAchats(userId: string, pageRaw?: string, limitRaw?: string) {
    const { page, limit, skip } = pagination(pageRaw, limitRaw);
    const where = { userId };
    const [achats, total] = await Promise.all([
      this.prisma.shopPurchase.findMany({
        where,
        select: {
          id: true,
          itemType: true,
          itemName: true,
          costPoints: true,
          status: true,
          createdAt: true,
          raffleTicket: { select: { id: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.shopPurchase.count({ where }),
    ]);
    return {
      purchases: achats.map((achat) => ({
        id: achat.id,
        itemType: achat.itemType,
        itemName: achat.itemName,
        costPoints: achat.costPoints,
        status: achat.status,
        createdAt: achat.createdAt,
        raffleTicketId: achat.raffleTicket?.id,
      })),
      total,
      page,
      limit,
    };
  }

  async revelerCode(userId: string, purchaseId: string) {
    const achat = await this.prisma.shopPurchase.findFirst({
      where: { id: purchaseId, userId },
      include: { digitalCode: true },
    });
    if (!achat?.digitalCode) {
      throw new NotFoundException('Code d’achat introuvable.');
    }
    return {
      code: dechiffrerCode(
        achat.digitalCode.codeCiphertext,
        achat.digitalCode.keyVersion,
      ),
    };
  }

  async listerArticlesAdmin(pageRaw?: string, limitRaw?: string) {
    const { page, limit, skip } = pagination(pageRaw, limitRaw);
    const [items, total] = await Promise.all([
      this.prisma.shopItem.findMany({
        include: {
          raffle: { select: { id: true, titre: true, statut: true } },
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.shopItem.count(),
    ]);
    const ids = items.map((item) => item.id);
    const [disponibles, attribues] = await Promise.all([
      this.prisma.shopDigitalCode.groupBy({
        by: ['shopItemId'],
        where: {
          shopItemId: { in: ids },
          status: ShopDigitalCodeStatus.AVAILABLE,
        },
        _count: { id: true },
      }),
      this.prisma.shopDigitalCode.groupBy({
        by: ['shopItemId'],
        where: {
          shopItemId: { in: ids },
          status: ShopDigitalCodeStatus.ASSIGNED,
        },
        _count: { id: true },
      }),
    ]);
    const disponiblesParItem = new Map(
      disponibles.map((row) => [row.shopItemId, row._count.id]),
    );
    const attribuesParItem = new Map(
      attribues.map((row) => [row.shopItemId, row._count.id]),
    );
    return {
      items: items.map((item) => ({
        ...this.vueItem(item),
        availableCodeCount: disponiblesParItem.get(item.id) ?? 0,
        assignedCodeCount: attribuesParItem.get(item.id) ?? 0,
      })),
      total,
      page,
      limit,
    };
  }

  async creerArticle(dto: CreateShopItemDto, actorId: string) {
    this.validerLienTirage(dto.type, dto.raffleId);
    if (dto.active && dto.type !== ShopItemType.RAFFLE_TICKET) {
      throw new ConflictException(
        'Importe d’abord les codes numériques avant d’activer l’article.',
      );
    }
    const raffle =
      dto.type === ShopItemType.RAFFLE_TICKET
        ? await this.prisma.raffle.findUnique({ where: { id: dto.raffleId! } })
        : null;
    if (dto.type === ShopItemType.RAFFLE_TICKET && !raffle) {
      throw new NotFoundException('Tirage introuvable.');
    }
    const item = await this.prisma.shopItem.create({
      data: {
        type: dto.type,
        nom: dto.nom.trim(),
        description: dto.description?.trim() ?? '',
        imageUrl: dto.imageUrl ?? null,
        costPoints: dto.costPoints,
        active: dto.active ?? false,
        maxPerUser: dto.maxPerUser ?? null,
        raffleId: dto.raffleId ?? null,
      },
    });
    await this.audit(this.prisma, actorId, 'SHOP_ITEM_CREATED', item.id, {
      type: item.type,
      costPoints: item.costPoints,
      active: item.active,
    });
    return {
      ...this.vueItem(item),
      availableCodeCount: 0,
      assignedCodeCount: 0,
    };
  }

  async modifierArticle(id: string, dto: UpdateShopItemDto, actorId: string) {
    const item = await this.prisma.$transaction(async (tx) => {
      if (!(await this.verrouillerArticle(tx, id))) {
        throw new NotFoundException('Article introuvable.');
      }
      const current = await tx.shopItem.findUnique({
        where: { id },
        include: { _count: { select: { codes: true, purchases: true } } },
      });
      if (!current) throw new NotFoundException('Article introuvable.');
      const type = dto.type ?? current.type;
      const raffleId =
        dto.raffleId === undefined ? current.raffleId : dto.raffleId;
      this.validerLienTirage(type, raffleId ?? undefined);
      if (
        (type !== current.type || raffleId !== current.raffleId) &&
        (current._count.codes > 0 || current._count.purchases > 0)
      ) {
        throw new ConflictException(
          'Le type et le tirage sont immuables après import de codes ou achat.',
        );
      }
      if (dto.active === true && type !== ShopItemType.RAFFLE_TICKET) {
        const disponibles = await tx.shopDigitalCode.count({
          where: { shopItemId: id, status: ShopDigitalCodeStatus.AVAILABLE },
        });
        if (disponibles === 0 && !current.active) {
          throw new ConflictException(
            'Importe d’abord les codes numériques avant d’activer l’article.',
          );
        }
      }
      if (type === ShopItemType.RAFFLE_TICKET && raffleId) {
        const raffle = await tx.raffle.findUnique({
          where: { id: raffleId },
        });
        if (!raffle) throw new NotFoundException('Tirage introuvable.');
      }
      const updated = await tx.shopItem.update({
        where: { id },
        data: {
          ...(dto.type === undefined ? {} : { type: dto.type }),
          ...(dto.nom === undefined ? {} : { nom: dto.nom.trim() }),
          ...(dto.description === undefined
            ? {}
            : { description: dto.description.trim() }),
          ...(dto.imageUrl === undefined ? {} : { imageUrl: dto.imageUrl }),
          ...(dto.costPoints === undefined
            ? {}
            : { costPoints: dto.costPoints }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
          ...(dto.maxPerUser === undefined
            ? {}
            : { maxPerUser: dto.maxPerUser }),
          ...(dto.raffleId === undefined ? {} : { raffleId: dto.raffleId }),
        },
        include: {
          raffle: { select: { id: true, titre: true, statut: true } },
        },
      });
      await this.audit(tx, actorId, 'SHOP_ITEM_UPDATED', id, {
        changedFields: Object.keys(dto),
      });
      return updated;
    });
    const [availableCodeCount, assignedCodeCount] = await Promise.all([
      this.prisma.shopDigitalCode.count({
        where: { shopItemId: id, status: ShopDigitalCodeStatus.AVAILABLE },
      }),
      this.prisma.shopDigitalCode.count({
        where: { shopItemId: id, status: ShopDigitalCodeStatus.ASSIGNED },
      }),
    ]);
    return { ...this.vueItem(item), availableCodeCount, assignedCodeCount };
  }

  async desactiverArticle(id: string, actorId: string) {
    const item = await this.prisma.shopItem.updateMany({
      where: { id },
      data: { active: false },
    });
    if (!item.count) throw new NotFoundException('Article introuvable.');
    await this.audit(this.prisma, actorId, 'SHOP_ITEM_ARCHIVED', id, {});
    return { id, active: false };
  }

  async importerCodes(id: string, dto: ImportShopCodesDto, actorId: string) {
    const codes = dto.codes.map((code) => code.trim().normalize('NFC'));
    if (codes.some((code) => !code)) {
      throw new BadRequestException(
        'Les codes importés ne peuvent pas être vides.',
      );
    }
    const uniques = new Map<string, ReturnType<typeof chiffrerCode>>();
    for (const code of codes) {
      const encoded = chiffrerCode(code);
      uniques.set(encoded.codeHash, encoded);
    }
    const insertion = await this.prisma.$transaction(async (tx) => {
      if (!(await this.verrouillerArticle(tx, id))) {
        throw new NotFoundException('Article introuvable.');
      }
      const item = await tx.shopItem.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Article introuvable.');
      if (item.type === ShopItemType.RAFFLE_TICKET) {
        throw new ConflictException(
          'Un ticket de tirage n’utilise pas de stock de codes.',
        );
      }
      const result = await tx.shopDigitalCode.createMany({
        data: [...uniques.values()].map((encoded) => ({
          shopItemId: id,
          codeCiphertext: encoded.ciphertext,
          codeHash: encoded.codeHash,
          keyVersion: encoded.keyVersion,
        })),
        skipDuplicates: true,
      });
      await this.audit(tx, actorId, 'SHOP_CODES_IMPORTED', id, {
        accepted: result.count,
        rejected: dto.codes.length - result.count,
      });
      return result;
    });
    const rejected = dto.codes.length - insertion.count;
    return { accepted: insertion.count, rejected };
  }

  private async verrouillerArticle(
    tx: ClientTransactionnel,
    itemId: string,
  ): Promise<boolean> {
    const rows = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT "id" FROM "shop_items" WHERE "id" = ${itemId} FOR UPDATE`,
    );
    return rows.length > 0;
  }

  async listerAchatsAdmin(pageRaw?: string, limitRaw?: string) {
    const { page, limit, skip } = pagination(pageRaw, limitRaw);
    const where = {};
    const [achats, total] = await Promise.all([
      this.prisma.shopPurchase.findMany({
        where,
        select: {
          id: true,
          itemType: true,
          itemName: true,
          costPoints: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, pseudo: true } },
          raffleTicket: { select: { id: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.shopPurchase.count({ where }),
    ]);
    return {
      items: achats.map((achat) => ({
        id: achat.id,
        itemType: achat.itemType,
        itemName: achat.itemName,
        costPoints: achat.costPoints,
        status: achat.status,
        createdAt: achat.createdAt,
        userId: achat.user.id,
        pseudo: achat.user.pseudo,
        raffleTicketId: achat.raffleTicket?.id,
      })),
      total,
      page,
      limit,
    };
  }

  private vueItem(item: CatalogueItem) {
    return {
      id: item.id,
      type: item.type,
      nom: item.nom,
      description: item.description,
      imageUrl: item.imageUrl,
      costPoints: item.costPoints,
      maxPerUser: item.maxPerUser,
      active: item.active,
      raffleId: item.raffleId,
      raffle: item.raffle
        ? {
            id: item.raffle.id,
            titre: item.raffle.titre,
            statut: item.raffle.statut,
            dateOuverture: item.raffle.dateOuverture,
            dateTirage: item.raffle.dateTirage,
          }
        : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private validerLienTirage(type: ShopItemType, raffleId?: string | null) {
    if (type === ShopItemType.RAFFLE_TICKET && !raffleId) {
      throw new BadRequestException(
        'Un ticket de tirage doit être associé à un tirage.',
      );
    }
    if (type !== ShopItemType.RAFFLE_TICKET && raffleId) {
      throw new BadRequestException(
        'Seul un ticket de tirage peut être associé à un tirage.',
      );
    }
  }

  private audit(
    client: Pick<PrismaService, 'contentAuditEvent'>,
    actorId: string,
    action: string,
    entityId: string,
    metadata: object,
  ) {
    return client.contentAuditEvent.create({
      data: { actorId, action, entityType: 'ShopItem', entityId, metadata },
    });
  }
}
