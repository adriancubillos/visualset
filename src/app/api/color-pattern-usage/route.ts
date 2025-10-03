import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { isApiError } from '@/lib/errors';
import colorPatternUsageService from '@/services/colorPatternUsageService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const excludeEntityId = searchParams.get('excludeEntityId');
  const entityType = searchParams.get('entityType');

  if (!entityType) {
    logger.apiError('color-pattern-usage', '/api/color-pattern-usage', 'entityType is required');
    return NextResponse.json({ error: { code: 'MISSING_ENTITY_TYPE', message: 'entityType is required' } }, { status: 400 });
  }

  try {
    const usedCombinations = await colorPatternUsageService.fetchUsedCombinations(prisma, entityType, {
      excludeEntityId: excludeEntityId ?? undefined,
    });

    logger.info(`Fetched color pattern usage for entityType: ${entityType}`);
    return NextResponse.json({ usedCombinations });
  } catch (err) {
    if (isApiError(err)) {
      // map ApiError to standard response shape
      logger.apiError('color-pattern-usage', '/api/color-pattern-usage', err);
      return NextResponse.json({ error: { code: err.code, message: err.message, details: err.details } }, { status: err.status });
    }

    logger.apiError('color-pattern-usage', '/api/color-pattern-usage', err ?? 'Error fetching color pattern usage');
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
