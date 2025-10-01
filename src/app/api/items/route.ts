import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

// GET /api/items
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    logger.dbError('Fetch items', 'item', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/items
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const item = await prisma.item.create({
      data: {
        name: body.name,
        description: body.description || null,
        status: body.status || 'ACTIVE',
        quantity: body.quantity || 1,
        projectId: body.projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    logger.dbError('Create item', 'item', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
