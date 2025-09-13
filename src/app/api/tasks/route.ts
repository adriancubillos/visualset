import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tasks
export async function GET() {
  const tasks = await prisma.task.findMany({
    include: {
      project: true,
      machine: true,
      operator: true,
    },
  });
  return NextResponse.json(tasks);
}

// POST /api/tasks
export async function POST(req: Request) {
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      durationMin: body.durationMin,
      status: body.status ?? 'PENDING',
      projectId: body.projectId ?? null,
      machineId: body.machineId ?? null,
      operatorId: body.operatorId ?? null,
      scheduledAt: body.scheduledAt ?? null,
    },
    include: {
      project: true,
      machine: true,
      operator: true,
    },
  });
  return NextResponse.json(task);
}
