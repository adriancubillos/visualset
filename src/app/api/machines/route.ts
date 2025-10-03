import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import machineService from '@/services/machineService';
import { logger } from '@/utils/logger';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/machines
export async function GET() {
  try {
    const machines = await machineService.listMachines(prisma);
    return NextResponse.json(machines);
  } catch (error) {
    logger.apiError('Fetch machines', '/api/machines', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// POST /api/machines
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const machine = await machineService.createMachine(prisma, body);
    return NextResponse.json(machine);
  } catch (error) {
    logger.apiError('Create machine', '/api/machines', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
