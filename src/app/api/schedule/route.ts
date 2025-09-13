import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/schedule
// Body: { taskId, machineId?, operatorId?, scheduledAt? }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id: body.taskId },
      data: {
        machineId: body.machineId ?? null,
        operatorId: body.operatorId ?? null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: 'SCHEDULED',
      },
      include: {
        machine: true,
        operator: true,
      },
    });

    return NextResponse.json(task);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
