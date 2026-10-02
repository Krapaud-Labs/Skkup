-- Content management foundation for the P12 admin workspace.
CREATE TYPE "ManagedContentType" AS ENUM ('LANDING', 'LEGAL', 'ANNOUNCEMENT', 'FAQ', 'MEDIA');
CREATE TYPE "ManagedContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "managed_contents" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ManagedContentType" NOT NULL,
    "locale" TEXT NOT NULL,
    "status" "ManagedContentStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "managed_contents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "status" "ManagedContentStatus" NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_audit_events" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "managed_contents_slug_type_locale_key" ON "managed_contents"("slug", "type", "locale");
CREATE INDEX "managed_contents_type_locale_status_idx" ON "managed_contents"("type", "locale", "status");
CREATE UNIQUE INDEX "content_versions_contentId_version_key" ON "content_versions"("contentId", "version");
CREATE INDEX "content_versions_contentId_createdAt_idx" ON "content_versions"("contentId", "createdAt");
CREATE INDEX "content_audit_events_entityType_entityId_createdAt_idx" ON "content_audit_events"("entityType", "entityId", "createdAt");
CREATE INDEX "content_audit_events_actorId_createdAt_idx" ON "content_audit_events"("actorId", "createdAt");

ALTER TABLE "managed_contents" ADD CONSTRAINT "managed_contents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "managed_contents" ADD CONSTRAINT "managed_contents_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "managed_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "content_audit_events" ADD CONSTRAINT "content_audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
