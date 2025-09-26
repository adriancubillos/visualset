import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConflictCheckParams {
  scheduledAt: string;
  durationMin: number;
  machineId?: string | null;
  operatorId?: string | null;
  excludeTaskId?: string; // For task editing - exclude current task
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: 'machine' | 'operator';
  conflictData?: {
    id: string;
    title: string;
    scheduledAt: Date;
    durationMin: number;
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
}: ConflictCheckParams): Promise<ConflictResult> {
  // Parse the scheduledAt string as UTC (it should already be in UTC format from the APIs)
  const taskStartTime = new Date(scheduledAt);
  const taskEndTime = new Date(taskStartTime.getTime() + durationMin * 60 * 1000);

  // Check for machine conflicts
  if (machineId) {
    const machineConflicts = await prisma.task.findMany({
      where: {
        ...(excludeTaskId && { id: { not: excludeTaskId } }),
        machineId,
        scheduledAt: { not: null },
        durationMin: { gt: 0 },
        OR: [
          {
            AND: [
              { scheduledAt: { lt: taskEndTime.toISOString() } },
              {
                scheduledAt: {
                  gte: new Date(taskStartTime.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                },
              },
            ],
          },
        ],
      },
      include: {
        machine: true,
      },
    });

    // Check each machine conflict for actual time overlap
    for (const conflict of machineConflicts) {
      if (conflict.scheduledAt && conflict.durationMin) {
        const conflictStart = new Date(conflict.scheduledAt);
        const conflictEnd = new Date(conflictStart.getTime() + conflict.durationMin * 60 * 1000);

        if (timeRangesOverlap(taskStartTime, taskEndTime, conflictStart, conflictEnd)) {
          return {
            hasConflict: true,
            conflictType: 'machine',
            conflictData: {
              id: conflict.id,
              title: conflict.title,
              scheduledAt: conflict.scheduledAt,
              durationMin: conflict.durationMin,
              machine: conflict.machine,
            },
          };
        }
      }
    }
  }

  // Check for operator conflicts
  if (operatorId) {
    const operatorConflicts = await prisma.task.findMany({
      where: {
        ...(excludeTaskId && { id: { not: excludeTaskId } }),
        operatorId,
        scheduledAt: { not: null },
        durationMin: { gt: 0 },
        OR: [
          {
            AND: [
              { scheduledAt: { lt: taskEndTime.toISOString() } },
              {
                scheduledAt: {
                  gte: new Date(taskStartTime.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                },
              },
            ],
          },
        ],
      },
      include: {
        operator: true,
      },
    });

    // Check each operator conflict for actual time overlap
    for (const conflict of operatorConflicts) {
      if (conflict.scheduledAt && conflict.durationMin) {
        const conflictStart = new Date(conflict.scheduledAt);
        const conflictEnd = new Date(conflictStart.getTime() + conflict.durationMin * 60 * 1000);

        if (timeRangesOverlap(taskStartTime, taskEndTime, conflictStart, conflictEnd)) {
          return {
            hasConflict: true,
            conflictType: 'operator',
            conflictData: {
              id: conflict.id,
              title: conflict.title,
              scheduledAt: conflict.scheduledAt,
              durationMin: conflict.durationMin,
              operator: conflict.operator,
            },
          };
        }
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
