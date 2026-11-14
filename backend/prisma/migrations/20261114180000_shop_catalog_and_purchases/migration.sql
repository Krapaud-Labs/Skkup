CREATE TYPE "ShopItemType" AS ENUM ('PROMO_CODE', 'GIFT_CARD', 'RAFFLE_TICKET');
CREATE TYPE "ShopPurchaseStatus" AS ENUM ('READY_TO_REVEAL', 'FULFILLED');
CREATE TYPE "ShopDigitalCodeStatus" AS ENUM ('AVAILABLE', 'ASSIGNED');

ALTER TYPE "PointsTransactionType" ADD VALUE 'SHOP_PURCHASE';

CREATE TABLE "shop_items" (
    "id" TEXT NOT NULL,
    "type" "ShopItemType" NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "costPoints" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "maxPerUser" INTEGER,
    "raffleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shop_items_costPoints_positive_check" CHECK ("costPoints" > 0),
    CONSTRAINT "shop_items_maxPerUser_positive_check" CHECK ("maxPerUser" IS NULL OR "maxPerUser" > 0),
    CONSTRAINT "shop_items_raffle_type_check" CHECK (("type" = 'RAFFLE_TICKET' AND "raffleId" IS NOT NULL) OR ("type" <> 'RAFFLE_TICKET' AND "raffleId" IS NULL)),
    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shop_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopItemId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "itemType" "ShopItemType" NOT NULL,
    "itemName" TEXT NOT NULL,
    "costPoints" INTEGER NOT NULL,
    "status" "ShopPurchaseStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shop_purchases_costPoints_positive_check" CHECK ("costPoints" > 0),
    CONSTRAINT "shop_purchases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shop_digital_codes" (
    "id" TEXT NOT NULL,
    "shopItemId" TEXT NOT NULL,
    "codeCiphertext" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "keyVersion" TEXT NOT NULL DEFAULT 'v1',
    "status" "ShopDigitalCodeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "purchaseId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shop_digital_codes_assignment_state_check" CHECK (("status" = 'AVAILABLE' AND "purchaseId" IS NULL) OR ("status" = 'ASSIGNED' AND "purchaseId" IS NOT NULL)),
    CONSTRAINT "shop_digital_codes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "points_transactions" ADD COLUMN "shopPurchaseId" TEXT;
ALTER TABLE "raffle_tickets" ADD COLUMN "shopPurchaseId" TEXT;

CREATE UNIQUE INDEX "points_transactions_shopPurchaseId_key" ON "points_transactions"("shopPurchaseId");
CREATE UNIQUE INDEX "raffle_tickets_shopPurchaseId_key" ON "raffle_tickets"("shopPurchaseId");
CREATE UNIQUE INDEX "shop_purchases_userId_idempotencyKey_key" ON "shop_purchases"("userId", "idempotencyKey");
CREATE INDEX "shop_purchases_userId_createdAt_idx" ON "shop_purchases"("userId", "createdAt");
CREATE INDEX "shop_purchases_shopItemId_createdAt_idx" ON "shop_purchases"("shopItemId", "createdAt");
CREATE UNIQUE INDEX "shop_digital_codes_codeHash_key" ON "shop_digital_codes"("codeHash");
CREATE UNIQUE INDEX "shop_digital_codes_purchaseId_key" ON "shop_digital_codes"("purchaseId");
CREATE INDEX "shop_digital_codes_shopItemId_status_createdAt_idx" ON "shop_digital_codes"("shopItemId", "status", "createdAt");
CREATE INDEX "shop_items_active_type_idx" ON "shop_items"("active", "type");
CREATE INDEX "shop_items_raffleId_idx" ON "shop_items"("raffleId");

ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_shopPurchaseId_fkey" FOREIGN KEY ("shopPurchaseId") REFERENCES "shop_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_shopPurchaseId_fkey" FOREIGN KEY ("shopPurchaseId") REFERENCES "shop_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shop_items" ADD CONSTRAINT "shop_items_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shop_purchases" ADD CONSTRAINT "shop_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shop_purchases" ADD CONSTRAINT "shop_purchases_shopItemId_fkey" FOREIGN KEY ("shopItemId") REFERENCES "shop_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shop_digital_codes" ADD CONSTRAINT "shop_digital_codes_shopItemId_fkey" FOREIGN KEY ("shopItemId") REFERENCES "shop_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shop_digital_codes" ADD CONSTRAINT "shop_digital_codes_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "shop_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
