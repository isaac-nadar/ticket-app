-- 1. Add column as nullable
ALTER TABLE "Card" ADD COLUMN "position" INTEGER;

-- 2. Backfill existing cards
UPDATE "Card"
SET "position" = 0
WHERE "position" IS NULL;

-- 3. Make column required
ALTER TABLE "Card"
ALTER COLUMN "position" SET NOT NULL;
