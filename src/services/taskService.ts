import { ApiError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import type { PrismaClient, Prisma, TaskStatus } from '@prisma/client';
import { TaskWithRelationsDTO } from '@/types/api';
import { checkSchedulingConflicts } from '@/utils/conflictDetection';

type TimeSlotInput = {
  id?: string;
  startDateTime: string;
  endDateTime?: string;
  durationMin?: number;
};

type TaskInput = {
  title?: string;
  description?: string;
  status?: string;
  quantity?: number;
  completed_quantity?: number;
  itemId?: string | null;
  projectId?: string | null;
  // Legacy single ID support for backward compatibility
  machineId?: string | null;
  operatorId?: string | null;
  // New multiple ID support
  machineIds?: string[];
  operatorIds?: string[];
  timeSlots?: TimeSlotInput[];
};

export type { TimeSlotInput, TaskInput };

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

// Helper function to check for operator/machine conflicts using the centralized utility
async function checkResourceConflicts(
  db: PrismaClient,
  operatorIds: string[] = [],
  machineIds: string[] = [],
  timeSlots: TimeSlotInput[],
  excludeTaskId?: string,
) {
  if (timeSlots.length === 0) return; // No time slots, no conflicts

  for (const slot of timeSlots) {
    if (!slot.startDateTime) continue;

    const durationMin = slot.durationMin || 60;

    // Use the centralized conflict detection utility
    const conflictResult = await checkSchedulingConflicts({
      scheduledAt: slot.startDateTime,
      durationMin,
      machineIds,
      operatorIds,
      excludeTaskId,
    });

    if (conflictResult.hasConflict && conflictResult.conflictData) {
      const { conflictType, conflictData } = conflictResult;
      const resourceType = conflictType === 'machine' ? 'Machine' : 'Operator';
      const resourceName = conflictType === 'machine' ? conflictData.machine?.name : conflictData.operator?.name;

      const conflictSlot = conflictData.timeSlot;
      const startTime = conflictSlot.startDateTime.toLocaleString();
      const endTime = conflictSlot.endDateTime?.toLocaleString() || 'end time';

      throw new ApiError({
        code: conflictType === 'machine' ? 'MACHINE_CONFLICT' : 'OPERATOR_CONFLICT',
        message: `${resourceType} "${resourceName}" is already assigned to task "${conflictData.title}" from ${startTime} to ${endTime}`,
        status: 409,
      });
    }
  }
}

export async function listTasks(db: PrismaClient, start?: string | null, end?: string | null) {
  const where: Record<string, unknown> = {};
  if (start || end) {
    where.timeSlots = { some: {} };
    if (start && end) {
      where.timeSlots = {
        some: {
          startDateTime: { gte: new Date(start), lte: new Date(end) },
        },
      };
    } else if (start) {
      where.timeSlots = { some: { startDateTime: { gte: new Date(start) } } };
    } else if (end) {
      where.timeSlots = { some: { startDateTime: { lte: new Date(end) } } };
    }
  }

  const tasks = await db.task.findMany({
    where,
    include: {
      item: { include: { project: true } },
      taskMachines: { include: { machine: true } },
      taskOperators: { include: { operator: true } },
      timeSlots: { orderBy: { startDateTime: 'asc' } },
    },
  });

  return tasks.map(transformTaskWithRelations);
}

export async function createTask(db: PrismaClient, body: TaskInput): Promise<TaskWithRelationsDTO | null> {
  // Minimal validation delegating detailed checks to caller/tests
  if (!body.title) throw new ApiError({ code: 'MISSING_TITLE', message: 'title is required', status: 400 });

  // Resolve itemId from project when necessary
  let itemId: string | null = body.itemId ?? null;
  if (!itemId && body.projectId) {
    let item = await db.item.findFirst({ where: { projectId: body.projectId } });
    if (!item) {
      item = await db.item.create({ data: { projectId: body.projectId, name: 'Default Item' } });
    }
    itemId = item.id;
  }

  const timeSlots: TimeSlotInput[] = body.timeSlots || [];

  // Check for overlapping slots within the same task
  for (let i = 0; i < timeSlots.length; i++) {
    for (let j = i + 1; j < timeSlots.length; j++) {
      const slotA = timeSlots[i];
      const slotB = timeSlots[j];
      if (slotA.startDateTime && slotB.startDateTime) {
        const startA = new Date(slotA.startDateTime);
        const endA = slotA.endDateTime
          ? new Date(slotA.endDateTime)
          : new Date(startA.getTime() + (slotA.durationMin || 60) * 60000);
        const startB = new Date(slotB.startDateTime);
        const endB = slotB.endDateTime
          ? new Date(slotB.endDateTime)
          : new Date(startB.getTime() + (slotB.durationMin || 60) * 60000);
        if (startA < endB && endA > startB) {
          throw new ApiError({
            code: 'TIME_SLOT_OVERLAP',
            message: 'Time slots within the same task cannot overlap',
            status: 400,
          });
        }
      }
    }
  }

  // Check for operator/machine conflicts with other tasks
  const operatorIds = body.operatorIds || (body.operatorId ? [body.operatorId] : []);
  const machineIds = body.machineIds || (body.machineId ? [body.machineId] : []);
  await checkResourceConflicts(db, operatorIds, machineIds, timeSlots);

  const result = await db.$transaction(async (tx) => {
    const createData: Prisma.TaskCreateInput = {
      title: body.title as string,
      description: body.description ?? null,
      status: (body.status ?? 'PENDING') as TaskStatus,
      quantity: body.quantity ?? 1,
      completed_quantity: body.completed_quantity ?? 0,
    };

    if (itemId) createData.item = { connect: { id: itemId } };

    const newTask = await tx.task.create({
      data: createData,
      include: {
        item: { include: { project: true } },
        taskMachines: { include: { machine: true } },
        taskOperators: { include: { operator: true } },
        timeSlots: { orderBy: { startDateTime: 'asc' } },
      },
    });

    // Create machine associations
    if (machineIds.length > 0) {
      await tx.taskMachine.createMany({
        data: machineIds.map((machineId) => ({
          taskId: newTask.id,
          machineId,
        })),
      });
    }

    // Create operator associations
    if (operatorIds.length > 0) {
      await tx.taskOperator.createMany({
        data: operatorIds.map((operatorId) => ({
          taskId: newTask.id,
          operatorId,
        })),
      });
    }

    if (timeSlots.length > 0) {
      const slotsToCreate = timeSlots.map((slot: TimeSlotInput) => {
        const slotDuration = slot.durationMin || 60;
        return {
          taskId: newTask.id,
          startDateTime: new Date(slot.startDateTime),
          endDateTime: slot.endDateTime
            ? new Date(slot.endDateTime)
            : new Date(new Date(slot.startDateTime).getTime() + slotDuration * 60000),
          durationMin: slotDuration,
        };
      });

      await tx.taskTimeSlot.createMany({ data: slotsToCreate });

      return await tx.task.findUnique({
        where: { id: newTask.id },
        include: {
          item: { include: { project: true } },
          taskMachines: { include: { machine: true } },
          taskOperators: { include: { operator: true } },
          timeSlots: { orderBy: { startDateTime: 'asc' } },
        },
      });
    }

    // Return task with all relations
    return await tx.task.findUnique({
      where: { id: newTask.id },
      include: {
        item: { include: { project: true } },
        taskMachines: { include: { machine: true } },
        taskOperators: { include: { operator: true } },
        timeSlots: { orderBy: { startDateTime: 'asc' } },
      },
    });
  });

  return result ? transformTaskWithRelations(result) : null;
}

export async function getTask(db: typeof prisma, id: string) {
  const task = await db.task.findUnique({
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

export async function updateTask(db: PrismaClient, id: string, body: TaskInput): Promise<TaskWithRelationsDTO | null> {
  const quantity = body.quantity || 1;
  const completedQuantity = body.completed_quantity || 0;
  if (completedQuantity > quantity)
    throw new ApiError({
      code: 'BAD_QUANTITY',
      message: 'Completed quantity cannot exceed total quantity',
      status: 400,
    });

  const timeSlots: TimeSlotInput[] = body.timeSlots || [];

  // overlap checks
  for (let i = 0; i < timeSlots.length; i++) {
    for (let j = i + 1; j < timeSlots.length; j++) {
      const slotA = timeSlots[i];
      const slotB = timeSlots[j];
      if (slotA.startDateTime && slotB.startDateTime) {
        const startA = new Date(slotA.startDateTime);
        const endA = slotA.endDateTime
          ? new Date(slotA.endDateTime)
          : new Date(startA.getTime() + (slotA.durationMin || 60) * 60000);
        const startB = new Date(slotB.startDateTime);
        const endB = slotB.endDateTime
          ? new Date(slotB.endDateTime)
          : new Date(startB.getTime() + (slotB.durationMin || 60) * 60000);
        if (startA < endB && endA > startB) {
          throw new ApiError({
            code: 'TIME_SLOT_OVERLAP',
            message: 'Time slots within the same task cannot overlap',
            status: 400,
          });
        }
      }
    }
  }

  // Check for operator/machine conflicts with other tasks (exclude current task)
  const operatorIds = body.operatorIds || (body.operatorId ? [body.operatorId] : []);
  const machineIds = body.machineIds || (body.machineId ? [body.machineId] : []);
  await checkResourceConflicts(db, operatorIds, machineIds, timeSlots, id);

  const result = await db.$transaction(async (tx) => {
    // Clear existing time slots and associations
    await tx.taskTimeSlot.deleteMany({ where: { taskId: id } });
    await tx.taskMachine.deleteMany({ where: { taskId: id } });
    await tx.taskOperator.deleteMany({ where: { taskId: id } });

    const updateDataRec: Record<string, unknown> = {};
    if (body.title !== undefined) updateDataRec.title = body.title as string;
    if (body.description !== undefined) updateDataRec.description = body.description ?? null;
    if (body.status !== undefined) updateDataRec.status = body.status as TaskStatus;
    updateDataRec.quantity = quantity;
    updateDataRec.completed_quantity = completedQuantity;
    if (body.itemId !== undefined)
      updateDataRec.item = body.itemId ? { connect: { id: body.itemId } } : { disconnect: true };

    await tx.task.update({
      where: { id },
      data: updateDataRec as Prisma.TaskUpdateInput,
    });

    // Create new machine associations
    if (machineIds.length > 0) {
      await tx.taskMachine.createMany({
        data: machineIds.map((machineId) => ({
          taskId: id,
          machineId,
        })),
      });
    }

    // Create new operator associations
    if (operatorIds.length > 0) {
      await tx.taskOperator.createMany({
        data: operatorIds.map((operatorId) => ({
          taskId: id,
          operatorId,
        })),
      });
    }

    // Create new time slots
    if (timeSlots.length > 0) {
      const slotsToCreate = timeSlots.map((slot: TimeSlotInput) => {
        const slotDuration = slot.durationMin || 60;
        return {
          taskId: id,
          startDateTime: new Date(slot.startDateTime),
          endDateTime: slot.endDateTime
            ? new Date(slot.endDateTime)
            : new Date(new Date(slot.startDateTime).getTime() + slotDuration * 60000),
          durationMin: slotDuration,
        };
      });
      await tx.taskTimeSlot.createMany({ data: slotsToCreate });
    }

    // Return updated task with all relations
    return await tx.task.findUnique({
      where: { id },
      include: {
        item: { include: { project: true } },
        taskMachines: { include: { machine: true } },
        taskOperators: { include: { operator: true } },
        timeSlots: { orderBy: { startDateTime: 'asc' } },
      },
    });
  });

  return result ? transformTaskWithRelations(result) : null;
}

export async function patchTask(db: PrismaClient, id: string, body: Partial<TaskInput>): Promise<TaskWithRelationsDTO> {
  // Get existing task to check for conflicts
  const existingTask = await db.task.findUnique({
    where: { id },
    include: {
      timeSlots: true,
      taskMachines: { include: { machine: true } },
      taskOperators: { include: { operator: true } },
    },
  });

  if (!existingTask) {
    throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 });
  }

  // If operator or machine is being changed, check for conflicts
  if (
    (body.operatorId !== undefined ||
      body.machineId !== undefined ||
      body.operatorIds !== undefined ||
      body.machineIds !== undefined) &&
    existingTask.timeSlots.length > 0
  ) {
    // Handle both legacy single IDs and new array IDs
    let operatorIds: string[] = [];
    let machineIds: string[] = [];

    if (body.operatorIds !== undefined) {
      operatorIds = body.operatorIds;
    } else if (body.operatorId !== undefined) {
      operatorIds = body.operatorId ? [body.operatorId] : [];
    } else {
      // Use existing task's operators from junction table
      operatorIds = existingTask.taskOperators.map((to) => to.operatorId);
    }

    if (body.machineIds !== undefined) {
      machineIds = body.machineIds;
    } else if (body.machineId !== undefined) {
      machineIds = body.machineId ? [body.machineId] : [];
    } else {
      // Use existing task's machines from junction table
      machineIds = existingTask.taskMachines.map((tm) => tm.machineId);
    }

    const timeSlots = existingTask.timeSlots.map((slot) => ({
      startDateTime: slot.startDateTime.toISOString(),
      endDateTime: slot.endDateTime?.toISOString(),
      durationMin: slot.durationMin,
    }));

    await checkResourceConflicts(db, operatorIds, machineIds, timeSlots, id);
  }

  const result = await db.$transaction(async (tx) => {
    // Handle machine and operator updates if provided
    const operatorIds = body.operatorIds || (body.operatorId ? [body.operatorId] : undefined);
    const machineIds = body.machineIds || (body.machineId ? [body.machineId] : undefined);

    if (operatorIds !== undefined) {
      // Clear existing operator associations and create new ones
      await tx.taskOperator.deleteMany({ where: { taskId: id } });
      if (operatorIds.length > 0) {
        await tx.taskOperator.createMany({
          data: operatorIds.map((operatorId) => ({
            taskId: id,
            operatorId,
          })),
        });
      }
    }

    if (machineIds !== undefined) {
      // Clear existing machine associations and create new ones
      await tx.taskMachine.deleteMany({ where: { taskId: id } });
      if (machineIds.length > 0) {
        await tx.taskMachine.createMany({
          data: machineIds.map((machineId) => ({
            taskId: id,
            machineId,
          })),
        });
      }
    }

    const dataRec: Record<string, unknown> = {};
    if (body.title !== undefined) dataRec.title = body.title as string;
    if (body.description !== undefined) dataRec.description = body.description ?? null;
    if (body.status !== undefined) dataRec.status = body.status as TaskStatus;
    if (body.quantity !== undefined) dataRec.quantity = body.quantity;
    if (body.completed_quantity !== undefined) dataRec.completed_quantity = body.completed_quantity;
    if (body.itemId !== undefined) dataRec.item = body.itemId ? { connect: { id: body.itemId } } : { disconnect: true };

    await tx.task.update({
      where: { id },
      data: dataRec as Prisma.TaskUpdateInput,
    });

    return await tx.task.findUnique({
      where: { id },
      include: {
        item: { include: { project: true } },
        taskMachines: { include: { machine: true } },
        taskOperators: { include: { operator: true } },
        timeSlots: { orderBy: { startDateTime: 'asc' } },
      },
    });
  });

  if (!result) throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 });
  return transformTaskWithRelations(result);
}

export async function deleteTask(db: typeof prisma, id: string) {
  await db.task.delete({ where: { id } });
}

const taskService = { listTasks, createTask, getTask, updateTask, patchTask, deleteTask };
export default taskService;
