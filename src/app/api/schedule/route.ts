import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { mapTaskToResponse } from '@/types/api';
import { checkSchedulingConflicts, createConflictErrorResponse } from '@/utils/conflictDetection';

// ----------------- GET -----------------
// Fetch all scheduled tasks, optionally filtered by date range
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    //BUG fix this
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
        item: {
          include: {
            project: true,
          },
        },
        machine: true,
        operator: true,
        timeSlots: {
          orderBy: {
            startDateTime: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const mapped = tasks.map((t) => mapTaskToResponse(t as unknown as import('@/types/api').TaskWithRelationsDTO));
    return NextResponse.json(mapped);
    //BUG fix this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.dbError('Fetch schedule', 'task', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------- POST -----------------
// Assign a task to machine/operator with conflict check
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, itemId, machineId, operatorId, scheduledAt, durationMin } = body;

    if (!taskId || !scheduledAt || durationMin === undefined) {
      return NextResponse.json({ error: 'taskId, scheduledAt and durationMin are required' }, { status: 400 });
    }

    // Fetch task to validate
    const taskToSchedule = await prisma.task.findUnique({ where: { id: taskId } });
    if (!taskToSchedule) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const startTime = new Date(scheduledAt);

    // ✅ Use centralized conflict detection
    if (machineId || operatorId) {
      const conflictResult = await checkSchedulingConflicts({
        scheduledAt,
        durationMin,
        machineId,
        operatorId,
        excludeTaskId: taskId, // Exclude current task being rescheduled
      });

      if (conflictResult.hasConflict) {
        const errorResponse = createConflictErrorResponse(conflictResult);
        return NextResponse.json(errorResponse, { status: 409 });
      }
    }

    // ✅ Update task and create/update time slot
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        itemId: itemId ?? null,
        machineId: machineId ?? null,
        operatorId: operatorId ?? null,
        status: 'SCHEDULED',
        timeSlots: {
          deleteMany: {}, // Remove existing time slots
          create: {
            startDateTime: startTime,
            endDateTime: endTime,
            durationMin,
          },
        },
      },
      include: {
        item: true,
        machine: true,
        operator: true,
        timeSlots: true,
      },
    });

    const mapped = mapTaskToResponse(task as unknown as import('@/types/api').TaskWithRelationsDTO);
    return NextResponse.json(mapped);
    //BUG fix
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.dbError('Update schedule', 'task', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
