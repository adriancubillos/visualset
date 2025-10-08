import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import configurationService from '@/services/configurationService';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/configuration/validate-all - Validate consistency across all configuration types
export async function GET() {
  try {
    const result = await configurationService.validateAndFixAllConsistency(prisma);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error validating configuration consistency:', error);
    const errorResponse = mapErrorToResponse(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
