import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ConfigurationCategory } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/configuration/[id] - Get specific configuration
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const configuration = await prisma.configuration.findUnique({
      where: { id: params.id },
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
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { category, value, label, sortOrder, isActive } = await request.json();

    // Validate category if provided
    if (category && !Object.values(ConfigurationCategory).includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const configuration = await prisma.configuration.update({
      where: { id: params.id },
      data: {
        ...(category && { category }),
        ...(value && { value }),
        ...(label && { label }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.configuration.delete({
      where: { id: params.id },
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
