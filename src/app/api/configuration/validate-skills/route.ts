import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import configurationService from '@/services/configurationService';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/configuration/validate-skills - Validate skill consistency (legacy endpoint)
export async function GET() {
  try {
    const result = await configurationService.validateAndFixSkillConsistency(prisma);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error validating skill consistency:', error);
    const errorResponse = mapErrorToResponse(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
