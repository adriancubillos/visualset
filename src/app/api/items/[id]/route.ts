import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/items/[id]
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        tasks: {
          include: {
            machine: {
              select: {
                id: true,
                name: true,
              },
            },
            operator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT /api/items/[id]
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // If trying to set status to COMPLETED, validate that all tasks are completed
    if (body.status === 'COMPLETED') {
      const itemWithTasks = await prisma.item.findUnique({
        where: { id },
        include: {
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!itemWithTasks) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // Check if there are any incomplete tasks
      const incompleteTasks = itemWithTasks.tasks.filter((task) => task.status !== 'COMPLETED');

      if (incompleteTasks.length > 0) {
        const taskTitles = incompleteTasks.map((task) => task.title).join(', ');
        return NextResponse.json(
          {
            error: 'Cannot complete item with incomplete tasks',
            details: `The following tasks must be completed first: ${taskTitles}`,
            incompleteTasks: incompleteTasks.map((task) => ({
              id: task.id,
              title: task.title,
              status: task.status,
            })),
          },
          { status: 400 },
        );
      }
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        status: body.status,
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
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/items/[id]
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // Check if item has any tasks
    const itemWithTasks = await prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!itemWithTasks) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (itemWithTasks._count.tasks > 0) {
      return NextResponse.json(
        { error: 'Cannot delete item with existing tasks. Please delete all tasks first.' },
        { status: 400 },
      );
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
