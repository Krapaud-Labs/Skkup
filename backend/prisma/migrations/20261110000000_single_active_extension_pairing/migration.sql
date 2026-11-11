-- Keep all pairing records, but revoke older unrevoked credentials so every
-- account starts with at most one current association.
WITH classements AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "userId"
      ORDER BY
        CASE WHEN "expireAt" > CURRENT_TIMESTAMP THEN 0 ELSE 1 END,
        "createdAt" DESC,
        "id" DESC
    ) AS rang
  FROM "extension_pairings"
  WHERE "revoqueAt" IS NULL
)
UPDATE "extension_pairings" AS appariement
SET "revoqueAt" = CURRENT_TIMESTAMP
FROM classements
WHERE appariement."id" = classements."id"
  AND classements.rang > 1;

-- The User-row lock serializes normal pairing requests. This index also
-- makes the one-unrevoked-credential invariant durable at the database layer.
CREATE UNIQUE INDEX "extension_pairings_one_unrevoked_per_user_key"
  ON "extension_pairings"("userId")
  WHERE "revoqueAt" IS NULL;
