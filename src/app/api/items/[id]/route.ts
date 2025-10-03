import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import itemService from '@/services/itemService';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/items/[id]
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const item = await itemService.getItem(prisma, id);
    return NextResponse.json(item);
  } catch (error) {
    logger.apiError('Fetch item', '/api/items/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// PUT /api/items/[id]
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const item = await itemService.updateItem(prisma, id, body);
    return NextResponse.json(item);
  } catch (error) {
    logger.apiError('Update item', '/api/items/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// DELETE /api/items/[id]
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await itemService.deleteItem(prisma, id);
    return NextResponse.json(result);
  } catch (error) {
    logger.apiError('Delete item', '/api/items/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
