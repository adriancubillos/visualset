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
  try {
    const body = await req.json();
    
    // Convert scheduledAt to proper ISO format if provided
    let scheduledAt = null;
    if (body.scheduledAt && body.scheduledAt.trim() !== '') {
      scheduledAt = new Date(body.scheduledAt).toISOString();
    }
    
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        durationMin: body.durationMin,
        status: body.status ?? 'PENDING',
        projectId: body.projectId ?? null,
        machineId: body.machineId ?? null,
        operatorId: body.operatorId ?? null,
        scheduledAt: scheduledAt,
      },
      include: {
        project: true,
        machine: true,
        operator: true,
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
