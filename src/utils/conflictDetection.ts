import prisma from '@/lib/prisma';

export interface ConflictCheckParams {
  scheduledAt: string;
  durationMin: number;
  machineIds?: string[]; // Changed from single machineId to array
  operatorIds?: string[]; // Changed from single operatorId to array
  excludeTaskId?: string; // For task editing - exclude current task
  excludeTimeSlotId?: string; // For time slot editing - exclude specific time slot
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: 'machine' | 'operator';
  conflictData?: {
    id: string;
    title: string;
    timeSlot: {
      id: string;
      startDateTime: Date;
      endDateTime: Date | null;
      durationMin: number;
    };
    machine?: { id: string; name: string } | null;
    operator?: { id: string; name: string } | null;
  };
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB;
}

/**
 * Check for scheduling conflicts with machines and operators
 */
export async function checkSchedulingConflicts({
  scheduledAt,
  durationMin,
  machineIds = [],
  operatorIds = [],
  excludeTaskId,
  excludeTimeSlotId,
}: ConflictCheckParams): Promise<ConflictResult> {
  // Parse the scheduledAt string as UTC (it should already be in UTC format from the APIs)
  const taskStartTime = new Date(scheduledAt);
  const taskEndTime = new Date(taskStartTime.getTime() + durationMin * 60 * 1000);

  // Check for machine conflicts by querying time slots for any of the assigned machines
  if (machineIds.length > 0) {
    const machineConflicts = await prisma.taskTimeSlot.findMany({
      where: {
        ...(excludeTimeSlotId && { id: { not: excludeTimeSlotId } }),
        task: {
          ...(excludeTaskId && { id: { not: excludeTaskId } }),
          taskMachines: {
            some: {
              machineId: {
                in: machineIds,
              },
            },
          },
        },
        OR: [
          {
            // Time slot starts before our task ends and ends after our task starts
            AND: [
              { startDateTime: { lt: taskEndTime } },
              {
                OR: [
                  { endDateTime: { gt: taskStartTime } },
                  { endDateTime: null }, // Handle null endDateTime by using duration
                ],
              },
            ],
          },
        ],
      },
      include: {
        task: {
          include: {
            taskMachines: {
              include: {
                machine: true,
              },
            },
          },
        },
      },
    });

    // Check each machine conflict for actual time overlap
    for (const timeSlot of machineConflicts) {
      const conflictStart = new Date(timeSlot.startDateTime);
      const conflictEnd = timeSlot.endDateTime
        ? new Date(timeSlot.endDateTime)
        : new Date(conflictStart.getTime() + timeSlot.durationMin * 60 * 1000);

      if (timeRangesOverlap(taskStartTime, taskEndTime, conflictStart, conflictEnd)) {
        // Find the conflicting machine(s) from the task's machines
        const taskWithMachines = timeSlot as unknown as {
          task?: { taskMachines?: Array<{ machineId: string; machine: unknown }>; id?: string; title?: string };
        };
        const conflictingMachine = taskWithMachines.task?.taskMachines?.find((tm) =>
          machineIds.includes(tm.machineId),
        )?.machine;

        return {
          hasConflict: true,
          conflictType: 'machine',
          conflictData: {
            id: taskWithMachines.task?.id || '',
            title: taskWithMachines.task?.title || '',
            timeSlot: {
              id: timeSlot.id,
              startDateTime: timeSlot.startDateTime,
              endDateTime: timeSlot.endDateTime,
              durationMin: timeSlot.durationMin,
            },
            machine: conflictingMachine as { id: string; name: string } | null,
          },
        };
      }
    }
  }

  // Check for operator conflicts by querying time slots for any of the assigned operators
  if (operatorIds.length > 0) {
    const operatorConflicts = await prisma.taskTimeSlot.findMany({
      where: {
        ...(excludeTimeSlotId && { id: { not: excludeTimeSlotId } }),
        task: {
          ...(excludeTaskId && { id: { not: excludeTaskId } }),
          taskOperators: {
            some: {
              operatorId: {
                in: operatorIds,
              },
            },
          },
        },
        OR: [
          {
            // Time slot starts before our task ends and ends after our task starts
            AND: [
              { startDateTime: { lt: taskEndTime } },
              {
                OR: [
                  { endDateTime: { gt: taskStartTime } },
                  { endDateTime: null }, // Handle null endDateTime by using duration
                ],
              },
            ],
          },
        ],
      },
      include: {
        task: {
          include: {
            taskOperators: {
              include: {
                operator: true,
              },
            },
          },
        },
      },
    });

    // Check each operator conflict for actual time overlap
    for (const timeSlot of operatorConflicts) {
      const conflictStart = new Date(timeSlot.startDateTime);
      const conflictEnd = timeSlot.endDateTime
        ? new Date(timeSlot.endDateTime)
        : new Date(conflictStart.getTime() + timeSlot.durationMin * 60 * 1000);

      if (timeRangesOverlap(taskStartTime, taskEndTime, conflictStart, conflictEnd)) {
        // Find the conflicting operator(s) from the task's operators
        const taskWithOperators = timeSlot as unknown as {
          task?: { taskOperators?: Array<{ operatorId: string; operator: unknown }>; id?: string; title?: string };
        };
        const conflictingOperator = taskWithOperators.task?.taskOperators?.find((to) =>
          operatorIds.includes(to.operatorId),
        )?.operator;

        return {
          hasConflict: true,
          conflictType: 'operator',
          conflictData: {
            id: taskWithOperators.task?.id || '',
            title: taskWithOperators.task?.title || '',
            timeSlot: {
              id: timeSlot.id,
              startDateTime: timeSlot.startDateTime,
              endDateTime: timeSlot.endDateTime,
              durationMin: timeSlot.durationMin,
            },
            operator: conflictingOperator as { id: string; name: string } | null,
          },
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Create standardized conflict error response
 */
export function createConflictErrorResponse(conflictResult: ConflictResult) {
  if (!conflictResult.hasConflict || !conflictResult.conflictData) {
    throw new Error('No conflict data provided');
  }

  const { conflictType, conflictData } = conflictResult;
  const resourceName = conflictType === 'machine' ? 'Machine' : 'Operator';

  return {
    error: `${resourceName} scheduling conflict detected`,
    conflict: conflictData,
  };
}
