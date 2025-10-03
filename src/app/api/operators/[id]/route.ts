import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import operatorService from '@/services/operatorService';
import { logger } from '@/utils/logger';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/operators/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const operator = await operatorService.getOperator(prisma, id);
    return NextResponse.json(operator);
  } catch (error) {
    logger.apiError('Fetch operator', `/api/operators/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// PUT /api/operators/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const operator = await operatorService.updateOperator(prisma, id, body);
    return NextResponse.json(operator);
  } catch (error) {
    logger.apiError('Update operator', `/api/operators/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// DELETE /api/operators/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await operatorService.deleteOperator(prisma, id);
    return NextResponse.json(result);
  } catch (error) {
    logger.apiError('Delete operator', `/api/operators/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
