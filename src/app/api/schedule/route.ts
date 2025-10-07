import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { mapTaskToResponse } from '@/types/api';
import scheduleService from '@/services/scheduleService';
import { mapErrorToResponse } from '@/lib/errors';

// ----------------- GET -----------------
// Fetch all scheduled tasks, optionally filtered by date range
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const tasks = await scheduleService.listScheduledTasks(prisma, start, end);
    const mapped = tasks.map((t) => mapTaskToResponse(t as unknown as import('@/types/api').TaskWithRelationsDTO));
    return NextResponse.json(mapped);
  } catch (error) {
    logger.apiError('Fetch schedule', '/api/schedule', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// ----------------- POST -----------------
// Assign a task to machine/operator with conflict check
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const task = await scheduleService.scheduleTask(prisma, body);
    const mapped = mapTaskToResponse(task as unknown as import('@/types/api').TaskWithRelationsDTO);
    return NextResponse.json(mapped);
    //BUG fix
  } catch (error) {
    logger.apiError('Update schedule', '/api/schedule', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
