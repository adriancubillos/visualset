import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationCategory } from '@prisma/client';

import prisma from '@/lib/prisma';
import configurationService from '@/services/configurationService';
import { ApiError, mapErrorToResponse } from '@/lib/errors';
import { logger } from '@/utils/logger';

// GET /api/configuration - Get all configurations or filter by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') as ConfigurationCategory) || null;

    const configurations = await configurationService.listConfigurations(prisma, category);

    return NextResponse.json(configurations);
  } catch (error: unknown) {
    logger.apiError('configuration', '/api/configuration', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// POST /api/configuration - Create new configuration
export async function POST(request: NextRequest) {
  try {
    const { category, value, label } = await request.json();

    // Validate required fields
    if (!category || !value || !label) {
      throw new ApiError({ code: 'MISSING_FIELDS', message: 'Category, value, and label are required', status: 400 });
    }

    // Validate category
    if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
      throw new ApiError({ code: 'INVALID_CATEGORY', message: 'Invalid category', status: 400 });
    }

    const configuration = await configurationService.createConfiguration(prisma, {
      category: category as ConfigurationCategory,
      value,
      label,
    });

    return NextResponse.json(configuration, { status: 201 });
  } catch (error: unknown) {
    // Type guard for Prisma-like errors with a numeric or string code
    const isPrismaError = (e: unknown): e is { code?: string } => {
      return !!(e && typeof e === 'object' && 'code' in e);
    };

    // Handle unique constraint violation from Prisma
    if (isPrismaError(error) && error.code === 'P2002') {
      const apiErr = new ApiError({
        code: 'CONFIGURATION_CONFLICT',
        message: 'Configuration with this value already exists in this category',
        status: 409,
      });
      logger.apiError('configuration', '/api/configuration', error);
      const mapped = mapErrorToResponse(apiErr);
      return NextResponse.json(mapped.body, { status: mapped.status });
    }

    logger.apiError('configuration', '/api/configuration', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
