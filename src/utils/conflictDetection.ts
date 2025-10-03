import prisma from '@/lib/prisma';

export interface ConflictCheckParams {
  scheduledAt: string;
  durationMin: number;
  machineId?: string | null;
  operatorId?: string | null;
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
  machineId,
  operatorId,
  excludeTaskId,
  excludeTimeSlotId,
}: ConflictCheckParams): Promise<ConflictResult> {
  // Parse the scheduledAt string as UTC (it should already be in UTC format from the APIs)
  const taskStartTime = new Date(scheduledAt);
  const taskEndTime = new Date(taskStartTime.getTime() + durationMin * 60 * 1000);

  // Check for machine conflicts by querying time slots
  if (machineId) {
    const machineConflicts = await prisma.taskTimeSlot.findMany({
      where: {
        ...(excludeTimeSlotId && { id: { not: excludeTimeSlotId } }),
        task: {
          ...(excludeTaskId && { id: { not: excludeTaskId } }),
          machineId,
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
            machine: true,
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
        return {
          hasConflict: true,
          conflictType: 'machine',
          conflictData: {
            id: timeSlot.task.id,
            title: timeSlot.task.title,
            timeSlot: {
              id: timeSlot.id,
              startDateTime: timeSlot.startDateTime,
              endDateTime: timeSlot.endDateTime,
              durationMin: timeSlot.durationMin,
            },
            machine: timeSlot.task.machine,
          },
        };
      }
    }
  }

  // Check for operator conflicts by querying time slots
  if (operatorId) {
    const operatorConflicts = await prisma.taskTimeSlot.findMany({
      where: {
        ...(excludeTimeSlotId && { id: { not: excludeTimeSlotId } }),
        task: {
          ...(excludeTaskId && { id: { not: excludeTaskId } }),
          operatorId,
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
            operator: true,
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
        return {
          hasConflict: true,
          conflictType: 'operator',
          conflictData: {
            id: timeSlot.task.id,
            title: timeSlot.task.title,
            timeSlot: {
              id: timeSlot.id,
              startDateTime: timeSlot.startDateTime,
              endDateTime: timeSlot.endDateTime,
              durationMin: timeSlot.durationMin,
            },
            operator: timeSlot.task.operator,
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
