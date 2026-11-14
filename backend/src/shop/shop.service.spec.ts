import {
  ConflictException,
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
import { PrismaService } from '../prisma/prisma.service';
import { ShopService } from './shop.service';
import { chiffrerCode, dechiffrerCode } from './shop-code-crypto';

describe('ShopService', () => {
  const raffleEnCours = {
    id: 'raffle-1',
    statut: RaffleStatus.OUVERT,
    dateOuverture: new Date(Date.now() - 60_000),
    dateTirage: new Date(Date.now() + 60_000),
  };
  const itemNumerique = {
    id: 'item-1',
    type: ShopItemType.PROMO_CODE,
    nom: 'Code partenaire',
    description: '',
    imageUrl: null,
    costPoints: 20,
    active: true,
    maxPerUser: 1,
    raffleId: null,
    raffle: null,
  };

  let service: ShopService;
  type TransactionMocks = {
    shopPurchase: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
    shopItem: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    user: { updateMany: jest.Mock; findUniqueOrThrow: jest.Mock };
    shopDigitalCode: {
      findMany: jest.Mock;
      updateMany: jest.Mock;
      groupBy: jest.Mock;
      count: jest.Mock;
      createMany: jest.Mock;
    };
    raffleTicket: { create: jest.Mock };
    pointsTransaction: { create: jest.Mock };
    raffle: { findUnique: jest.Mock };
    contentAuditEvent: { create: jest.Mock };
    $queryRaw: jest.Mock;
  };
  let prisma: TransactionMocks & { $transaction: jest.Mock };
  let tx: TransactionMocks;

  beforeEach(() => {
    jest.clearAllMocks();
    tx = {
      shopPurchase: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        create: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: Record<string, unknown> }) => ({
              id: 'purchase-1',
              ...data,
              createdAt: new Date('2026-11-14T10:00:00Z'),
            }),
          ),
        findMany: jest.fn(),
      },
      shopItem: {
        findUnique: jest.fn().mockResolvedValue(itemNumerique),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue(itemNumerique),
      },
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ soldePoints: 80 }),
      },
      shopDigitalCode: {
        findMany: jest.fn().mockResolvedValue([{ id: 'code-row-1' }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        groupBy: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      raffleTicket: { create: jest.fn().mockResolvedValue({ id: 'ticket-1' }) },
      pointsTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      },
      raffle: { findUnique: jest.fn() },
      contentAuditEvent: { create: jest.fn() },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'item-1' }]),
    };
    prisma = {
      ...tx,
      $transaction: jest.fn((callback: (client: TransactionMocks) => unknown) =>
        callback(tx),
      ),
    };
    service = new ShopService(prisma as unknown as PrismaService);
  });

  it('débite le solde, réserve un code et écrit une transaction négative atomiquement', async () => {
    const result = await service.acheter(
      'user-1',
      'item-1',
      'idempotency-key-001',
    );

    expect(result).toMatchObject({
      purchase: {
        id: 'purchase-1',
        itemType: ShopItemType.PROMO_CODE,
        itemName: 'Code partenaire',
        costPoints: 20,
        status: ShopPurchaseStatus.READY_TO_REVEAL,
      },
      costPoints: 20,
      soldePoints: 80,
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', soldePoints: { gte: 20 } },
      data: { soldePoints: { decrement: 20 } },
    });
    expect(tx.shopDigitalCode.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'code-row-1',
        status: ShopDigitalCodeStatus.AVAILABLE,
        purchaseId: null,
      },
      data: expect.objectContaining({
        status: ShopDigitalCodeStatus.ASSIGNED,
        purchaseId: 'purchase-1',
      }) as unknown,
    });
    expect(tx.pointsTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: PointsTransactionType.SHOP_PURCHASE,
        montant: -20,
        shopPurchaseId: 'purchase-1',
      },
    });
  });

  it('rejoue une clé d’idempotence sans redébiter le compte', async () => {
    tx.shopPurchase.findUnique.mockResolvedValue({
      id: 'purchase-old',
      shopItemId: 'item-1',
      itemType: ShopItemType.PROMO_CODE,
      itemName: 'Code partenaire',
      costPoints: 20,
      status: ShopPurchaseStatus.READY_TO_REVEAL,
      createdAt: new Date('2026-11-13T10:00:00Z'),
      digitalCode: null,
      raffleTicket: null,
    });

    const result = await service.acheter(
      'user-1',
      'item-1',
      'idempotency-key-001',
    );

    expect(result.purchase.id).toBe('purchase-old');
    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(tx.shopPurchase.create).not.toHaveBeenCalled();
    expect(tx.pointsTransaction.create).not.toHaveBeenCalled();
  });

  it('refuse la réutilisation d’une clé pour un article différent', async () => {
    tx.shopPurchase.findUnique.mockResolvedValue({
      id: 'purchase-old',
      shopItemId: 'other-item',
    });
    await expect(
      service.acheter('user-1', 'item-1', 'idempotency-key-001'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });

  it('refuse un achat sans solde suffisant', async () => {
    tx.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.acheter('user-1', 'item-1', 'idempotency-key-001'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(tx.shopPurchase.create).not.toHaveBeenCalled();
    expect(tx.pointsTransaction.create).not.toHaveBeenCalled();
  });

  it('refuse un achat quand la limite par compte est déjà atteinte', async () => {
    tx.shopPurchase.count.mockResolvedValue(1);
    await expect(
      service.acheter('user-1', 'item-1', 'idempotency-key-001'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });

  it('refuse un achat sans code numérique disponible', async () => {
    tx.shopDigitalCode.findMany.mockResolvedValue([]);
    await expect(
      service.acheter('user-1', 'item-1', 'idempotency-key-001'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.pointsTransaction.create).not.toHaveBeenCalled();
  });

  it('inscrit le ticket achetable au tirage ouvert dans la même transaction', async () => {
    tx.shopItem.findUnique.mockResolvedValue({
      ...itemNumerique,
      type: ShopItemType.RAFFLE_TICKET,
      nom: 'Ticket hebdomadaire',
      raffleId: raffleEnCours.id,
      raffle: raffleEnCours,
    });

    const result = await service.acheter(
      'user-1',
      'item-1',
      'idempotency-key-001',
    );

    expect(tx.raffleTicket.create).toHaveBeenCalledWith({
      data: {
        raffleId: raffleEnCours.id,
        userId: 'user-1',
        shopPurchaseId: 'purchase-1',
      },
      select: { id: true },
    });
    expect(result.purchase).toMatchObject({
      status: ShopPurchaseStatus.FULFILLED,
      raffleTicketId: 'ticket-1',
    });
    expect(tx.shopDigitalCode.findMany).not.toHaveBeenCalled();
    expect(tx.pointsTransaction.create).toHaveBeenCalled();
  });

  it('refuse les tickets liés à un tirage clôturé sans débiter', async () => {
    tx.shopItem.findUnique.mockResolvedValue({
      ...itemNumerique,
      type: ShopItemType.RAFFLE_TICKET,
      raffleId: raffleEnCours.id,
      raffle: { ...raffleEnCours, statut: RaffleStatus.CLOTURE },
    });
    await expect(
      service.acheter('user-1', 'item-1', 'idempotency-key-001'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(tx.raffleTicket.create).not.toHaveBeenCalled();
  });

  it('ne révèle jamais le code d’une commande appartenant à un autre compte', async () => {
    tx.shopPurchase.findFirst.mockResolvedValue(null);
    await expect(
      service.revelerCode('user-1', 'purchase-other'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.shopPurchase.findFirst).toHaveBeenCalledWith({
      where: { id: 'purchase-other', userId: 'user-1' },
      include: { digitalCode: true },
    });
  });

  it('verrouille l’article avant de vérifier que son type est immuable', async () => {
    tx.shopItem.findUnique.mockResolvedValue({
      ...itemNumerique,
      _count: { codes: 1, purchases: 0 },
    });

    await expect(
      service.modifierArticle(
        'item-1',
        { type: ShopItemType.GIFT_CARD },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.shopItem.findUnique.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(tx.shopItem.update).not.toHaveBeenCalled();
  });

  it('verrouille l’article et revérifie son type dans la transaction d’import', async () => {
    const ancienneCle = process.env.SHOP_CODE_ENCRYPTION_KEY_V1;
    process.env.SHOP_CODE_ENCRYPTION_KEY_V1 = '33'.repeat(32);
    tx.shopItem.findUnique.mockResolvedValue({
      ...itemNumerique,
      type: ShopItemType.RAFFLE_TICKET,
    });
    try {
      await expect(
        service.importerCodes(
          'item-1',
          { codes: ['PARTNER-CODE-1'] },
          'admin-1',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    } finally {
      if (ancienneCle === undefined)
        delete process.env.SHOP_CODE_ENCRYPTION_KEY_V1;
      else process.env.SHOP_CODE_ENCRYPTION_KEY_V1 = ancienneCle;
    }

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.shopItem.findUnique.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(tx.shopDigitalCode.createMany).not.toHaveBeenCalled();
  });

  it('révèle un code à son propriétaire seulement', async () => {
    const ancienneCle = process.env.SHOP_CODE_ENCRYPTION_KEY_V1;
    process.env.SHOP_CODE_ENCRYPTION_KEY_V1 = '22'.repeat(32);
    const encoded = chiffrerCode('OWNED-CODE');
    tx.shopPurchase.findFirst.mockResolvedValue({
      userId: 'user-1',
      digitalCode: {
        codeCiphertext: encoded.ciphertext,
        keyVersion: encoded.keyVersion,
      },
    });
    try {
      await expect(
        service.revelerCode('user-1', 'purchase-1'),
      ).resolves.toEqual({
        code: 'OWNED-CODE',
      });
    } finally {
      if (ancienneCle === undefined)
        delete process.env.SHOP_CODE_ENCRYPTION_KEY_V1;
      else process.env.SHOP_CODE_ENCRYPTION_KEY_V1 = ancienneCle;
    }
  });

  it('n’expose aucune donnée de code dans la liste admin des achats', async () => {
    tx.shopPurchase.findMany.mockResolvedValue([
      {
        id: 'purchase-1',
        itemType: ShopItemType.PROMO_CODE,
        itemName: 'Code partenaire',
        costPoints: 20,
        status: ShopPurchaseStatus.FULFILLED,
        createdAt: new Date('2026-11-14T10:00:00Z'),
        user: { id: 'user-1', pseudo: 'viewer' },
        raffleTicket: null,
        digitalCode: {
          codeCiphertext: 'secret-ciphertext',
          codeHash: 'secret-hash',
        },
      },
    ]);
    const result = await service.listerAchatsAdmin();

    expect(result.items[0]).not.toHaveProperty('digitalCode');
    expect(JSON.stringify(result)).not.toContain('secret-ciphertext');
    expect(JSON.stringify(result)).not.toContain('secret-hash');
  });

  it('chiffre et déchiffre les codes sans conserver la valeur en clair en base', () => {
    const ancienneCle = process.env.SHOP_CODE_ENCRYPTION_KEY_V1;
    process.env.SHOP_CODE_ENCRYPTION_KEY_V1 = '11'.repeat(32);
    try {
      const encoded = chiffrerCode('  SKKUP-PRIVATE  ');
      expect(encoded.ciphertext).not.toContain('SKKUP-PRIVATE');
      expect(encoded.keyVersion).toBe('v1');
      expect(dechiffrerCode(encoded.ciphertext, encoded.keyVersion)).toBe(
        'SKKUP-PRIVATE',
      );
    } finally {
      if (ancienneCle === undefined)
        delete process.env.SHOP_CODE_ENCRYPTION_KEY_V1;
      else process.env.SHOP_CODE_ENCRYPTION_KEY_V1 = ancienneCle;
    }
  });
});
