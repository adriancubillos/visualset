-- CreateEnum
CREATE TYPE "public"."OperatorStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "public"."Operator" ADD COLUMN     "email" TEXT,
ADD COLUMN     "shift" TEXT,
ADD COLUMN     "status" "public"."OperatorStatus" NOT NULL DEFAULT 'ACTIVE';
