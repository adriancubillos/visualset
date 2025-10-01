-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "measure" TEXT;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "imageUrl" TEXT;
