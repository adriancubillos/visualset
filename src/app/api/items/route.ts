import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import itemService from '@/services/itemService';
import { mapErrorToResponse } from '@/lib/errors';
import { ApiError } from '@/lib/errors';

// GET /api/items
export async function GET() {
  try {
    const items = await itemService.listItems(prisma);
    return NextResponse.json(items);
  } catch (error) {
    logger.apiError('Fetch items', '/api/items', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// POST /api/items
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.projectId) {
      throw new ApiError({ code: 'MISSING_PROJECT_ID', message: 'projectId is required', status: 400 });
    }
    const item = await itemService.createItem(prisma, body);
    return NextResponse.json(item);
  } catch (error) {
    logger.apiError('Create item', '/api/items', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
