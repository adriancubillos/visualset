-- DropIndex
DROP INDEX "Configuration_category_sortOrder_idx";

-- AlterTable
ALTER TABLE "Configuration" DROP COLUMN "isActive",
DROP COLUMN "sortOrder";

-- CreateIndex
CREATE INDEX "Configuration_category_idx" ON "Configuration"("category");