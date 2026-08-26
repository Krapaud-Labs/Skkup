-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TWITCH', 'YOUTUBE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WatchSessionStatus" AS ENUM ('EN_COURS', 'TERMINEE', 'INVALIDEE');

-- CreateEnum
CREATE TYPE "WatchSessionSource" AS ENUM ('EXTENSION', 'LECTEUR_EMBARQUE');

-- CreateEnum
CREATE TYPE "PointsTransactionType" AS ENUM ('VISITE_QUOTIDIENNE', 'WATCH_TIME', 'CARTE_A_GRATTER', 'AJUSTEMENT_ADMIN');

-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('OUVERT', 'CLOTURE', 'TIRE');

-- CreateEnum
CREATE TYPE "FraudFlagStatus" AS ENUM ('OUVERTE', 'EXAMINEE', 'IGNOREE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "pseudo" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "streakActuel" INTEGER NOT NULL DEFAULT 0,
    "streakMax" INTEGER NOT NULL DEFAULT 0,
    "derniereVisiteAt" TIMESTAMP(3),
    "soldePoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linked_platform_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "oauthTokenEncrypted" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linked_platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_states" (
    "id" TEXT NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "provider" "Platform" NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_pairing_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3) NOT NULL,
    "consommeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extension_pairing_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_pairings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3) NOT NULL,
    "revoqueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extension_pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "streamExternalId" TEXT NOT NULL,
    "source" "WatchSessionSource" NOT NULL,
    "debutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dernierHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dureeValideeSecondes" INTEGER NOT NULL DEFAULT 0,
    "statut" "WatchSessionStatus" NOT NULL DEFAULT 'EN_COURS',
    "dernierIntervalleSecondes" INTEGER,
    "intervallesIdentiquesConsecutifs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "watch_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streams" (
    "id" TEXT NOT NULL,
    "plateforme" "Platform" NOT NULL,
    "identifiantChaine" TEXT NOT NULL,
    "nomAffiche" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "estPartenaire" BOOLEAN NOT NULL DEFAULT false,
    "bonusPointsHeure" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PointsTransactionType" NOT NULL,
    "montant" INTEGER NOT NULL,
    "watchSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffles" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateOuverture" TIMESTAMP(3) NOT NULL,
    "dateTirage" TIMESTAMP(3) NOT NULL,
    "statut" "RaffleStatus" NOT NULL DEFAULT 'OUVERT',
    "graineAleatoire" TEXT,
    "resultatPublieAt" TIMESTAMP(3),
    "empreinteParticipants" TEXT,
    "nombreParticipants" INTEGER,
    "engagementGraine" TEXT,
    "entropiePublique" TEXT,

    CONSTRAINT "raffles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_lots" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "sponsorId" TEXT,
    "nom" TEXT NOT NULL,
    "valeurEstimee" DECIMAL(10,2) NOT NULL,
    "quantite" INTEGER NOT NULL,
    "fournisseur" TEXT NOT NULL,

    CONSTRAINT "raffle_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "logoUrl" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_tickets" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raffle_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_winners" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notifieAt" TIMESTAMP(3),

    CONSTRAINT "raffle_winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_draw_audits" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultHash" TEXT NOT NULL,
    "seedCommitment" TEXT NOT NULL,

    CONSTRAINT "raffle_draw_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scratch_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streakPalier" INTEGER NOT NULL,
    "grattee" BOOLEAN NOT NULL DEFAULT false,
    "gainType" TEXT,
    "gainMontant" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gratteeAt" TIMESTAMP(3),

    CONSTRAINT "scratch_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "debutAt" TIMESTAMP(3),
    "finAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchSessionId" TEXT,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "statut" "FraudFlagStatus" NOT NULL DEFAULT 'OUVERTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examineeAt" TIMESTAMP(3),

    CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "linked_platform_accounts_userId_idx" ON "linked_platform_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "linked_platform_accounts_platform_externalAccountId_key" ON "linked_platform_accounts"("platform", "externalAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_states_nonceHash_key" ON "oauth_states"("nonceHash");

-- CreateIndex
CREATE INDEX "oauth_states_expiresAt_idx" ON "oauth_states"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "extension_pairing_tokens_tokenHash_key" ON "extension_pairing_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "extension_pairing_tokens_userId_idx" ON "extension_pairing_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "extension_pairings_tokenHash_key" ON "extension_pairings"("tokenHash");

-- CreateIndex
CREATE INDEX "extension_pairings_userId_idx" ON "extension_pairings"("userId");

-- CreateIndex
CREATE INDEX "watch_sessions_userId_idx" ON "watch_sessions"("userId");

-- CreateIndex
CREATE INDEX "streams_actif_idx" ON "streams"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "streams_plateforme_identifiantChaine_key" ON "streams"("plateforme", "identifiantChaine");

-- CreateIndex
CREATE INDEX "points_transactions_userId_idx" ON "points_transactions"("userId");

-- CreateIndex
CREATE INDEX "raffle_lots_raffleId_idx" ON "raffle_lots"("raffleId");

-- CreateIndex
CREATE INDEX "raffle_lots_sponsorId_idx" ON "raffle_lots"("sponsorId");

-- CreateIndex
CREATE INDEX "sponsors_actif_idx" ON "sponsors"("actif");

-- CreateIndex
CREATE INDEX "raffle_tickets_raffleId_idx" ON "raffle_tickets"("raffleId");

-- CreateIndex
CREATE INDEX "raffle_tickets_userId_idx" ON "raffle_tickets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "raffle_winners_ticketId_key" ON "raffle_winners"("ticketId");

-- CreateIndex
CREATE INDEX "raffle_winners_raffleId_idx" ON "raffle_winners"("raffleId");

-- CreateIndex
CREATE INDEX "raffle_draw_audits_raffleId_idx" ON "raffle_draw_audits"("raffleId");

-- CreateIndex
CREATE INDEX "raffle_draw_audits_adminUserId_idx" ON "raffle_draw_audits"("adminUserId");

-- CreateIndex
CREATE INDEX "scratch_cards_userId_idx" ON "scratch_cards"("userId");

-- CreateIndex
CREATE INDEX "fraud_flags_userId_statut_idx" ON "fraud_flags"("userId", "statut");

-- CreateIndex
CREATE INDEX "fraud_flags_watchSessionId_idx" ON "fraud_flags"("watchSessionId");

-- AddForeignKey
ALTER TABLE "linked_platform_accounts" ADD CONSTRAINT "linked_platform_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_pairing_tokens" ADD CONSTRAINT "extension_pairing_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_pairings" ADD CONSTRAINT "extension_pairings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_sessions" ADD CONSTRAINT "watch_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_watchSessionId_fkey" FOREIGN KEY ("watchSessionId") REFERENCES "watch_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_lots" ADD CONSTRAINT "raffle_lots_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_lots" ADD CONSTRAINT "raffle_lots_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_winners" ADD CONSTRAINT "raffle_winners_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_winners" ADD CONSTRAINT "raffle_winners_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "raffle_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_winners" ADD CONSTRAINT "raffle_winners_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "raffle_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_winners" ADD CONSTRAINT "raffle_winners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_draw_audits" ADD CONSTRAINT "raffle_draw_audits_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_draw_audits" ADD CONSTRAINT "raffle_draw_audits_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_cards" ADD CONSTRAINT "scratch_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_watchSessionId_fkey" FOREIGN KEY ("watchSessionId") REFERENCES "watch_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
