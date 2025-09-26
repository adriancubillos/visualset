import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { mapTaskToResponse, TaskResponseDTO, TaskWithRelationsDTO } from '@/types/api';
import { parseGMTMinus5DateTime } from '@/utils/timezone';
import { checkSchedulingConflicts, createConflictErrorResponse } from '@/utils/conflictDetection';

const prisma = new PrismaClient();

// GET /api/tasks
export async function GET() {
  const tasks = await prisma.task.findMany({
    include: {
      item: { include: { project: true } },
      machine: true,
      operator: true,
    },
  });

  const mapped: TaskResponseDTO[] = tasks.map((t) => mapTaskToResponse(t as unknown as TaskWithRelationsDTO));
  return NextResponse.json(mapped);
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

    // Resolve itemId: prefer explicit itemId, otherwise accept projectId and find/create a default Item
    let itemId: string | null = body.itemId ?? null;
    if (!itemId && body.projectId) {
      let item = await prisma.item.findFirst({ where: { projectId: body.projectId } });
      if (!item) {
        item = await prisma.item.create({ data: { projectId: body.projectId, name: 'Default Item' } });
      }
      itemId = item.id;
    }

    // ✅ Add conflict detection for scheduled tasks
    if (scheduledAt && body.durationMin && (body.machineId || body.operatorId)) {
      const conflictResult = await checkSchedulingConflicts({
        scheduledAt,
        durationMin: body.durationMin,
        machineId: body.machineId,
        operatorId: body.operatorId,
      });

      if (conflictResult.hasConflict) {
        const errorResponse = createConflictErrorResponse(conflictResult);
        return NextResponse.json(errorResponse, { status: 409 });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        durationMin: body.durationMin,
        status: body.status ?? 'PENDING',
        itemId: itemId,
        machineId: body.machineId ?? null,
        operatorId: body.operatorId ?? null,
        scheduledAt: scheduledAt,
      },
      include: {
        item: { include: { project: true } },
        machine: true,
        operator: true,
      },
    });
    const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
