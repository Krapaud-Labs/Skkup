-- Additive migration: preserve `actif` for deployed and historical clients.
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TYPE "Platform" ADD VALUE 'KICK';

ALTER TABLE "announcements" ADD COLUMN "status" "AnnouncementStatus";

-- Preserve current visibility. Hidden records are never promoted implicitly.
UPDATE "announcements"
SET "status" = CASE
  WHEN "actif" = TRUE THEN 'PUBLISHED'::"AnnouncementStatus"
  ELSE 'ARCHIVED'::"AnnouncementStatus"
END;

ALTER TABLE "announcements" ALTER COLUMN "status" SET NOT NULL;

-- Compatibility bridge for older application instances which only read/write
-- `actif`. New code supplies both fields and the trigger verifies consistency.
CREATE FUNCTION sync_announcement_status_compatibility()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."status" IS NULL THEN
      NEW."status" := CASE
        WHEN NEW."actif" THEN 'PUBLISHED'::"AnnouncementStatus"
        ELSE 'ARCHIVED'::"AnnouncementStatus"
      END;
    ELSIF NEW."actif" IS DISTINCT FROM (NEW."status" = 'PUBLISHED') THEN
      RAISE EXCEPTION 'announcement status and actif alias disagree'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."status" IS DISTINCT FROM OLD."status"
     AND NEW."actif" IS DISTINCT FROM OLD."actif" THEN
    IF NEW."actif" IS DISTINCT FROM (NEW."status" = 'PUBLISHED') THEN
      RAISE EXCEPTION 'announcement status and actif alias disagree'
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW."status" IS DISTINCT FROM OLD."status" THEN
    NEW."actif" := (NEW."status" = 'PUBLISHED');
  ELSIF NEW."actif" IS DISTINCT FROM OLD."actif" THEN
    NEW."status" := CASE
      WHEN NEW."actif" THEN 'PUBLISHED'::"AnnouncementStatus"
      ELSE 'ARCHIVED'::"AnnouncementStatus"
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER announcements_sync_status_compatibility
BEFORE INSERT OR UPDATE ON "announcements"
FOR EACH ROW EXECUTE FUNCTION sync_announcement_status_compatibility();

ALTER TABLE "announcements"
ADD CONSTRAINT "announcements_status_actif_consistent"
CHECK ("actif" = ("status" = 'PUBLISHED'));

CREATE INDEX "announcements_status_createdAt_id_idx"
ON "announcements"("status", "createdAt" DESC, "id" DESC);
