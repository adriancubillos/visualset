-- DropIndex (only if it exists)
DROP INDEX IF EXISTS "Configuration_category_sortOrder_idx";

-- AlterTable
ALTER TABLE "Configuration" DROP COLUMN IF EXISTS "isActive",
DROP COLUMN IF EXISTS "sortOrder";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Configuration_category_idx" ON "Configuration"("category");