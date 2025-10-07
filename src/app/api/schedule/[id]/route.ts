import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { mapErrorToResponse } from '@/lib/errors';
import scheduleService from '@/services/scheduleService';

// GET /api/schedule/:id
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await scheduleService.getTask(prisma, id);
    return NextResponse.json(task);
  } catch (error) {
    logger.apiError('Fetch schedule', `/api/schedule/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
