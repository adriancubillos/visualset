import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import colorPatternUsageService from '@/services/colorPatternUsageService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const excludeEntityId = searchParams.get('excludeEntityId');
  const entityType = searchParams.get('entityType');

  if (!entityType) {
    return NextResponse.json({ error: 'entityType is required' }, { status: 400 });
  }

  try {
    const usedCombinations = await colorPatternUsageService.fetchUsedCombinations(prisma, entityType, {
      excludeEntityId: excludeEntityId ?? undefined,
    });

    return NextResponse.json({ usedCombinations });
  } catch (err) {
    // Distinguish validation errors from internal errors
    if (err instanceof Error && err.message.startsWith('Unsupported entityType')) {
      return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
    }

    logger.error('Error fetching color pattern usage', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
