import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationCategory } from '@prisma/client';
import prisma from '@/lib/prisma';

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

    const configuration = await prisma.configuration.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(value && { value }),
        ...(label && { label }),
      },
    });

    return NextResponse.json(configuration);
  } catch (error: unknown) {
    console.error('Error updating configuration:', error);

    // Handle record not found
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Configuration with this value already exists in this category' },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}

// DELETE /api/configuration/[id] - Delete configuration
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.configuration.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Configuration deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting configuration:', error);

    // Handle record not found
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
  }
}
