import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ConfigurationCategory } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/configuration - Get all configurations or filter by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as ConfigurationCategory | null;

    const configurations = await prisma.configuration.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });

    return NextResponse.json(configurations);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 });
  }
}

// POST /api/configuration - Create new configuration
export async function POST(request: NextRequest) {
  try {
    const { category, value, label, sortOrder = 0 } = await request.json();

    // Validate required fields
    if (!category || !value || !label) {
      return NextResponse.json({ error: 'Category, value, and label are required' }, { status: 400 });
    }

    // Validate category
    if (!Object.values(ConfigurationCategory).includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const configuration = await prisma.configuration.create({
      data: {
        category,
        value,
        label,
        sortOrder,
      },
    });

    return NextResponse.json(configuration, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating configuration:', error);

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Configuration with this value already exists in this category' },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 });
  }
}
