/*
  Warnings:

  - You are about to drop the column `projectId` on the `Task` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD');

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."Machine" ADD COLUMN     "color" TEXT,
ADD COLUMN     "pattern" TEXT;

-- AlterTable
ALTER TABLE "public"."Operator" ADD COLUMN     "color" TEXT,
ADD COLUMN     "pattern" TEXT;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "projectId",
ADD COLUMN     "itemId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
