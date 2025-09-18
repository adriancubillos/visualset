import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tasks/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        machine: true,
        operator: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PUT /api/tasks/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Convert scheduledAt to proper ISO format if provided
    let scheduledAt = null;
    if (body.scheduledAt && body.scheduledAt.trim() !== '') {
      scheduledAt = new Date(body.scheduledAt).toISOString();
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        durationMin: body.durationMin,
        status: body.status,
        projectId: body.projectId || null,
        machineId: body.machineId || null,
        operatorId: body.operatorId || null,
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
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// PATCH /api/tasks/[id] - For partial updates like status changes
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const task = await prisma.task.update({
      where: { id },
      data: body,
      include: {
        project: true,
        machine: true,
        operator: true,
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
