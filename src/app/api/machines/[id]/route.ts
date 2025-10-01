import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

// GET /api/machines/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            item: {
              include: {
                project: true,
              },
            },
            operator: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    return NextResponse.json(machine);
  } catch (error) {
    logger.dbError('Fetch machine', 'machine', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/machines/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const machine = await prisma.machine.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        status: body.status,
        location: body.location,
        color: body.color,
        pattern: body.pattern,
      },
    });

    return NextResponse.json(machine);
  } catch (error) {
    logger.dbError('Update machine', 'machine', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/machines/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Check if machine has any assigned tasks
    const tasksCount = await prisma.task.count({
      where: { machineId: id },
    });

    if (tasksCount > 0) {
      return NextResponse.json({ error: 'Cannot delete machine with assigned tasks' }, { status: 400 });
    }

    await prisma.machine.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    logger.dbError('Delete machine', 'machine', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
