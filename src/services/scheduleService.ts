import type { PrismaClient } from '@prisma/client';
import { ApiError } from '@/lib/errors';
import { checkSchedulingConflicts, createConflictErrorResponse } from '@/utils/conflictDetection';
import type { ScheduleTaskRequestDTO } from '@/types/api';

export async function listScheduledTasks(prisma: PrismaClient, start?: string | null, end?: string | null) {
  // Build where clause for optional date filtering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (start && end) {
    where.timeSlots = {
      some: {
        startDateTime: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
    };
  }

  return prisma.task.findMany({
    where,
    include: {
      item: { include: { project: true } },
      machine: true,
      operator: true,
      timeSlots: { orderBy: { startDateTime: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getTask(prisma: PrismaClient, id: string) {
  const task = await prisma.task.findUnique({ where: { id }, include: { machine: true, operator: true } });
  if (!task) throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 });
  return task;
}

export async function scheduleTask(prisma: PrismaClient, body: ScheduleTaskRequestDTO) {
  const { taskId, itemId, machineId, operatorId, scheduledAt, durationMin } = body;

  if (!taskId || !scheduledAt || durationMin === undefined) {
    throw new ApiError({
      code: 'MISSING_FIELDS',
      message: 'taskId, scheduledAt and durationMin are required',
      status: 400,
    });
  }

  const taskToSchedule = await prisma.task.findUnique({ where: { id: taskId } });
  if (!taskToSchedule) throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 });

  const startTime = new Date(scheduledAt);

  if (machineId || operatorId) {
    const conflictResult = await checkSchedulingConflicts({
      scheduledAt,
      durationMin,
      machineId,
      operatorId,
      excludeTaskId: taskId,
    });
    if (conflictResult.hasConflict) {
      // Return structured conflict response using service helper
      const conflictResponse = createConflictErrorResponse(conflictResult);
      throw new ApiError({
        code: 'SCHEDULING_CONFLICT',
        message: 'Scheduling conflict',
        status: 409,
        details: conflictResponse,
      });
    }
  }

  const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      itemId: itemId ?? null,
      machineId: machineId ?? null,
      operatorId: operatorId ?? null,
      status: 'SCHEDULED',
      timeSlots: { deleteMany: {}, create: { startDateTime: startTime, endDateTime: endTime, durationMin } },
    },
    include: { item: true, machine: true, operator: true, timeSlots: true },
  });

  return task;
}

const exported = { listScheduledTasks, getTask, scheduleTask };
export default exported;
