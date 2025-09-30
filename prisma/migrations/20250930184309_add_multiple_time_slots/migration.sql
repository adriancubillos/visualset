/*
  Warnings:

  - You are about to drop the column `scheduledAt` on the `Task` table. All the data in the column will be lost.

*/

-- CreateTable
CREATE TABLE "public"."task_time_slots" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_time_slots_taskId_idx" ON "public"."task_time_slots"("taskId");

-- CreateIndex
CREATE INDEX "task_time_slots_startDateTime_idx" ON "public"."task_time_slots"("startDateTime");

-- AddForeignKey
ALTER TABLE "public"."task_time_slots" ADD CONSTRAINT "task_time_slots_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing scheduledAt data to time slots
-- For each task with scheduledAt, create a primary time slot
INSERT INTO "public"."task_time_slots" ("id", "taskId", "startDateTime", "endDateTime", "isPrimary", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as id,
    "id" as "taskId",
    "scheduledAt" as "startDateTime",
    ("scheduledAt" + INTERVAL '1 minute' * "durationMin") as "endDateTime",
    true as "isPrimary",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "public"."Task" 
WHERE "scheduledAt" IS NOT NULL;

-- Now drop the scheduledAt column
ALTER TABLE "public"."Task" DROP COLUMN "scheduledAt";
