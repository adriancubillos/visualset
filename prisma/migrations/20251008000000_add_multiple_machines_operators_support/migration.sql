-- CreateTable
CREATE TABLE "TaskMachine" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskMachine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOperator" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOperator_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data: copy single machineId relationships to TaskMachine junction table
INSERT INTO "TaskMachine" ("id", "taskId", "machineId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    "id",
    "machineId",
    "createdAt",
    "updatedAt"
FROM "Task" 
WHERE "machineId" IS NOT NULL;

-- Migrate existing data: copy single operatorId relationships to TaskOperator junction table
INSERT INTO "TaskOperator" ("id", "taskId", "operatorId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    "id",
    "operatorId",
    "createdAt",
    "updatedAt"
FROM "Task" 
WHERE "operatorId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_machineId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_operatorId_fkey";

-- DropColumn
ALTER TABLE "Task" DROP COLUMN "machineId";

-- DropColumn
ALTER TABLE "Task" DROP COLUMN "operatorId";

-- CreateIndex
CREATE INDEX "TaskMachine_taskId_idx" ON "TaskMachine"("taskId");

-- CreateIndex
CREATE INDEX "TaskMachine_machineId_idx" ON "TaskMachine"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskMachine_taskId_machineId_key" ON "TaskMachine"("taskId", "machineId");

-- CreateIndex
CREATE INDEX "TaskOperator_taskId_idx" ON "TaskOperator"("taskId");

-- CreateIndex
CREATE INDEX "TaskOperator_operatorId_idx" ON "TaskOperator"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskOperator_taskId_operatorId_key" ON "TaskOperator"("taskId", "operatorId");

-- AddForeignKey
ALTER TABLE "TaskMachine" ADD CONSTRAINT "TaskMachine_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMachine" ADD CONSTRAINT "TaskMachine_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOperator" ADD CONSTRAINT "TaskOperator_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOperator" ADD CONSTRAINT "TaskOperator_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;