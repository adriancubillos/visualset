import type { PrismaClient } from '@prisma/client';
import { ApiError } from '@/lib/errors';
import { checkSchedulingConflicts, createConflictErrorResponse } from '@/utils/conflictDetection';
import type { ScheduleTaskRequestDTO, TaskWithRelationsDTO } from '@/types/api';

// Helper function to transform Prisma result to API DTO
function transformTaskWithRelations(task: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  quantity: number;
  completed_quantity: number;
  item?: unknown;
  itemId: string | null;
  taskMachines?: Array<{ machine: unknown }>;
  taskOperators?: Array<{ operator: unknown }>;
  timeSlots?: unknown[];
  createdAt: Date;
  updatedAt: Date;
}): TaskWithRelationsDTO {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    quantity: task.quantity,
    completed_quantity: task.completed_quantity,
    item: task.item as TaskWithRelationsDTO['item'],
    itemId: task.itemId,
    machines: (task.taskMachines?.map((tm) => tm.machine) || []) as TaskWithRelationsDTO['machines'],
    operators: (task.taskOperators?.map((to) => to.operator) || []) as TaskWithRelationsDTO['operators'],
    timeSlots: task.timeSlots as TaskWithRelationsDTO['timeSlots'],
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

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

  const tasks = await prisma.task.findMany({
    where,
    include: {
      item: { include: { project: true } },
      taskMachines: { include: { machine: true } },
      taskOperators: { include: { operator: true } },
      timeSlots: { orderBy: { startDateTime: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return tasks.map(transformTaskWithRelations);
}

export async function getTask(prisma: PrismaClient, id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      item: { include: { project: true } },
      taskMachines: { include: { machine: true } },
      taskOperators: { include: { operator: true } },
      timeSlots: { orderBy: { startDateTime: 'asc' } },
    },
  });
  if (!task) throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 });
  return transformTaskWithRelations(task);
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
      machineIds: machineId ? [machineId] : [],
      operatorIds: operatorId ? [operatorId] : [],
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

  const task = await prisma.$transaction(async (tx) => {
    // Update basic task data
    await tx.task.update({
      where: { id: taskId },
      data: {
        itemId: itemId ?? null,
        status: 'SCHEDULED',
      },
    });

    // Clear existing machine/operator associations
    await tx.taskMachine.deleteMany({ where: { taskId } });
    await tx.taskOperator.deleteMany({ where: { taskId } });

    // Add new machine association if provided
    if (machineId) {
      await tx.taskMachine.create({
        data: { taskId, machineId },
      });
    }

    // Add new operator association if provided
    if (operatorId) {
      await tx.taskOperator.create({
        data: { taskId, operatorId },
      });
    }

    // Update time slots
    await tx.taskTimeSlot.deleteMany({ where: { taskId } });
    await tx.taskTimeSlot.create({
      data: { taskId, startDateTime: startTime, endDateTime: endTime, durationMin },
    });

    // Return updated task with relations
    return await tx.task.findUnique({
      where: { id: taskId },
      include: {
        item: { include: { project: true } },
        taskMachines: { include: { machine: true } },
        taskOperators: { include: { operator: true } },
        timeSlots: { orderBy: { startDateTime: 'asc' } },
      },
    });
  });

  if (!task) throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found after scheduling', status: 500 });
  return transformTaskWithRelations(task);
}

const exported = { listScheduledTasks, getTask, scheduleTask };
export default exported;
