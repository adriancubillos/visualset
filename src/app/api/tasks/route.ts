import { NextResponse } from 'next/server';
import { mapTaskToResponse, TaskResponseDTO, TaskWithRelationsDTO } from '@/types/api';
import { logger } from '@/utils/logger';
import taskService from '@/services/taskService';
import { mapErrorToResponse } from '@/lib/errors';
import type { TaskInput } from '@/services/taskService';

// ...existing code...

// GET /api/tasks
export async function GET(req?: Request) {
  try {
    const url = req ? new URL(req.url) : new URL('http://localhost/api/tasks');
    const { searchParams } = url;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const tasks = await taskService.listTasks(await (await import('@/lib/prisma')).default, start, end);
    const mapped: TaskResponseDTO[] = tasks.map((t) => mapTaskToResponse(t as unknown as TaskWithRelationsDTO));
    return NextResponse.json(mapped);
  } catch (error) {
    logger.apiError('Fetch tasks', '/api/tasks', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// POST /api/tasks
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const task = await taskService.createTask(await (await import('@/lib/prisma')).default, body as TaskInput);
    const mapped = mapTaskToResponse(task as unknown as TaskWithRelationsDTO);
    return NextResponse.json(mapped);
  } catch (error) {
    logger.apiError('Create task', '/api/tasks', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
