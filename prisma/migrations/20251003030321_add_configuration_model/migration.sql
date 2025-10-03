-- CreateEnum
CREATE TYPE "public"."ConfigurationCategory" AS ENUM ('AVAILABLE_SKILLS', 'MACHINE_TYPES', 'TASK_TITLES', 'TASK_PRIORITY', 'OPERATOR_SHIFTS');

-- CreateTable
CREATE TABLE "public"."Configuration" (
    "id" TEXT NOT NULL,
    "category" "public"."ConfigurationCategory" NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_value_key" ON "public"."Configuration"("value");

-- CreateIndex
CREATE INDEX "Configuration_category_sortOrder_idx" ON "public"."Configuration"("category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_category_value_key" ON "public"."Configuration"("category", "value");
