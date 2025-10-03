import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import machineService from '@/services/machineService';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/machines/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const machine = await machineService.getMachine(prisma, id);
    return NextResponse.json(machine);
  } catch (error) {
    logger.apiError('Fetch machine', '/api/machines/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// PUT /api/machines/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const machine = await machineService.updateMachine(prisma, id, body);
    return NextResponse.json(machine);
  } catch (error) {
    logger.apiError('Update machine', '/api/machines/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// DELETE /api/machines/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await machineService.deleteMachine(prisma, id);
    return NextResponse.json(result);
  } catch (error) {
    logger.apiError('Delete machine', '/api/machines/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
