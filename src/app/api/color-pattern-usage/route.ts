import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { mapErrorToResponse } from '@/lib/errors';
import colorPatternUsageService from '@/services/colorPatternUsageService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const excludeEntityId = searchParams.get('excludeEntityId');
  const entityType = searchParams.get('entityType');

  if (!entityType) {
    logger.apiError('color-pattern-usage', '/api/color-pattern-usage', 'entityType is required');
    return NextResponse.json(
      { error: { code: 'MISSING_ENTITY_TYPE', message: 'entityType is required' } },
      { status: 400 },
    );
  }

  try {
    const usedCombinations = await colorPatternUsageService.fetchUsedCombinations(prisma, entityType, {
      excludeEntityId: excludeEntityId ?? undefined,
    });

    logger.info(`Fetched color pattern usage for entityType: ${entityType}`);
    return NextResponse.json({ usedCombinations });
  } catch (err) {
    // Use centralized mapping from errors to response shape
    const mapped = mapErrorToResponse(err);
    logger.apiError('color-pattern-usage', '/api/color-pattern-usage', err ?? 'Error fetching color pattern usage');
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
