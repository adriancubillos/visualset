import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parseGMTMinus5DateTime } from '@/utils/timezone';

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
    
    // Handle scheduledAt with GMT-5 timezone
    let scheduledAt = null;
    if (body.scheduledAt && body.scheduledAt.trim() !== '') {
      // If date and time are provided separately, parse as GMT-5
      if (body.scheduledDate && body.startTime) {
        scheduledAt = parseGMTMinus5DateTime(body.scheduledDate, body.startTime).toISOString();
      } else {
        // Fallback to direct parsing
        scheduledAt = new Date(body.scheduledAt).toISOString();
      }
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
