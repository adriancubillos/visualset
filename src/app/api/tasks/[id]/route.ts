import { NextRequest, NextResponse } from 'next/server';
import { mapTaskToResponse, TaskWithRelationsDTO } from '@/types/api';
import { logger } from '@/utils/logger';
import taskService from '@/services/taskService';
import { mapErrorToResponse } from '@/lib/errors';
import type { TaskInput } from '@/services/taskService';

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await taskService.getTask(await (await import('@/lib/prisma')).default, id);
    const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    logger.apiError('Fetch task', `/api/tasks/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// PUT /api/tasks/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const task = await taskService.updateTask(await (await import('@/lib/prisma')).default, id, body as TaskInput);
    const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    logger.apiError('Update task', `/api/tasks/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// PATCH /api/tasks/[id] - For partial updates like status changes
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const task = await taskService.patchTask(
      await (
        await import('@/lib/prisma')
      ).default,
      id,
      body as Partial<TaskInput>,
    );
    const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    logger.apiError('Patch task', `/api/tasks/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await taskService.deleteTask(await (await import('@/lib/prisma')).default, id);
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.apiError('Delete task', `/api/tasks/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
