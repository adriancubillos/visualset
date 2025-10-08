import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationCategory } from '@prisma/client';
import prisma from '@/lib/prisma';
import configurationService from '@/services/configurationService';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/configuration/[id] - Get specific configuration
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const configuration = await prisma.configuration.findUnique({
      where: { id },
    });

    if (!configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json(configuration);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

// PUT /api/configuration/[id] - Update configuration
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { category, value, label } = await request.json();

    // Validate category if provided
    if (category && !Object.values(ConfigurationCategory).includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Use the service function that handles cascading updates
    const configuration = await configurationService.updateConfiguration(prisma, id, {
      value,
      label,
    });

    return NextResponse.json(configuration);
  } catch (error: unknown) {
    console.error('Error updating configuration:', error);
    const errorResponse = mapErrorToResponse(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// DELETE /api/configuration/[id] - Delete configuration
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await configurationService.deleteConfiguration(prisma, id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error deleting configuration:', error);
    const errorResponse = mapErrorToResponse(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
