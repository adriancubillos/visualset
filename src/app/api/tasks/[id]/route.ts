import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { mapTaskToResponse, TaskWithRelationsDTO } from '@/types/api';
import { parseGMTMinus5DateTime } from '@/utils/timezone';

const prisma = new PrismaClient();

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        item: true,
        machine: true,
        operator: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

  const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
  return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PUT /api/tasks/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    // Resolve itemId if projectId supplied
    let itemId: string | null = body.itemId ?? null;
    if (!itemId && body.projectId) {
      let item = await prisma.item.findFirst({ where: { projectId: body.projectId } });
      if (!item) {
        item = await prisma.item.create({ data: { projectId: body.projectId, name: 'Default Item' } });
      }
      itemId = item.id;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        durationMin: body.durationMin,
        status: body.status,
        itemId: itemId || null,
        machineId: body.machineId || null,
        operatorId: body.operatorId || null,
        scheduledAt: scheduledAt,
      },
      include: {
        item: true,
        machine: true,
        operator: true,
      },
    });
  const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
  return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// PATCH /api/tasks/[id] - For partial updates like status changes
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

  const task = await prisma.task.update({
      where: { id },
      data: body,
      include: {
        item: true,
        machine: true,
        operator: true,
      },
    });
  const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
  return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
