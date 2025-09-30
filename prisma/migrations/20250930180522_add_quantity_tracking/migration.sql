-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "completed_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
