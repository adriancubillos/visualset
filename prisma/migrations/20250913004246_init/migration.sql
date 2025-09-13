-- CreateEnum
CREATE TYPE "public"."MachineStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateTable
CREATE TABLE "public"."Machine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "public"."MachineStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skills" TEXT[],
    "availability" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "machineId" TEXT,
    "operatorId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
