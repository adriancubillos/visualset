import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      where.scheduledAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        machine: true,
        operator: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return NextResponse.json(tasks);
    //BUG fix this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------- POST -----------------
// Assign a task to machine/operator with conflict check
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, projectId, machineId, operatorId, scheduledAt, durationMin } = body;

    if (!taskId || !scheduledAt || durationMin === undefined) {
      return NextResponse.json({ error: 'taskId, scheduledAt and durationMin are required' }, { status: 400 });
    }

    // Fetch task to validate
    const taskToSchedule = await prisma.task.findUnique({ where: { id: taskId } });
    if (!taskToSchedule) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

    // Overlap check
    const overlaps = (startA: Date, endA: Date, startB: Date, endB: Date) => startA < endB && endA > startB;

    // Machine conflict
    if (machineId) {
      const machineConflicts = await prisma.task.findMany({
        where: {
          machineId,
          id: { not: taskId },
          scheduledAt: { not: null },
        },
        include: { machine: true },
      });

      const conflict = machineConflicts.find((t: any) =>
        overlaps(
          startTime,
          endTime,
          t.scheduledAt!,
          new Date(t.scheduledAt!.getTime() + (t.durationMin || 60) * 60 * 1000),
        ),
      );

      if (conflict) {
        return NextResponse.json(
          {
            error: 'Machine is already booked at this time',
            conflict: {
              taskId: conflict.id,
              title: conflict.title,
              scheduledAt: conflict.scheduledAt,
              durationMin: conflict.durationMin,
              machine: conflict.machine,
            },
          },
          { status: 400 },
        );
      }
    }

    // Operator conflict
    if (operatorId) {
      const operatorConflicts = await prisma.task.findMany({
        where: { operatorId, id: { not: taskId }, scheduledAt: { not: null } },
      });

      const conflict = operatorConflicts.find((t: any) =>
        overlaps(
          startTime,
          endTime,
          t.scheduledAt!,
          new Date(t.scheduledAt!.getTime() + (t.durationMin || 60) * 60 * 1000),
        ),
      );

      if (conflict) {
        return NextResponse.json({ error: 'Operator is already booked at this time', conflict }, { status: 400 });
      }
    }

    // ✅ Update task including durationMin
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        projectId: projectId ?? null,
        machineId: machineId ?? null,
        operatorId: operatorId ?? null,
        scheduledAt: startTime,
        durationMin,
        status: 'SCHEDULED',
      },
      include: {
        project: true,
        machine: true,
        operator: true,
      },
    });

    return NextResponse.json(task);
    //BUG fix
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
