import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import operatorService from '@/services/operatorService';
import { logger } from '@/utils/logger';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/operators
export async function GET() {
  try {
    const operators = await operatorService.listOperators(prisma);
    return NextResponse.json(operators);
  } catch (error) {
    logger.apiError('Fetch operators', '/api/operators', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// POST /api/operators
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const operator = await operatorService.createOperator(prisma, body);
    return NextResponse.json(operator);
  } catch (error) {
    logger.apiError('Create operator', '/api/operators', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
