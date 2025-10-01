import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

// GET /api/operators/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const operator = await prisma.operator.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            item: {
              include: {
                project: true,
              },
            },
            machine: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    return NextResponse.json(operator);
  } catch (error) {
    logger.dbError('Fetch operator', 'operator', error);
    return NextResponse.json({ error: 'Failed to fetch operator' }, { status: 500 });
  }
}

// PUT /api/operators/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const operator = await prisma.operator.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        skills: body.skills,
        status: body.status,
        shift: body.shift,
        color: body.color,
        pattern: body.pattern,
        availability: body.availability,
      },
    });
    return NextResponse.json(operator);
  } catch (error) {
    logger.dbError('Update operator', 'operator', error);
    return NextResponse.json({ error: 'Failed to update operator' }, { status: 500 });
  }
}

// DELETE /api/operators/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Check if operator has any assigned tasks
    const tasksCount = await prisma.task.count({
      where: { operatorId: id },
    });

    if (tasksCount > 0) {
      return NextResponse.json({ error: 'Cannot delete operator with assigned tasks' }, { status: 400 });
    }

    // Now delete the operator
    await prisma.operator.delete({ where: { id } });
    return NextResponse.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    logger.dbError('Delete operator', 'operator', error);
    return NextResponse.json(
      {
        error: 'Failed to delete operator',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
