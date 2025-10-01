import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

// GET /api/projects/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          tasks: {
            include: { machine: true, operator: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PUT /api/projects/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // If trying to set status to COMPLETED, validate that all items are completed
    if (body.status === 'COMPLETED') {
      const projectWithItems = await prisma.project.findUnique({
        where: { id },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      if (!projectWithItems) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Check if there are any incomplete items
      const incompleteItems = projectWithItems.items.filter((item) => item.status !== 'COMPLETED');

      if (incompleteItems.length > 0) {
        const itemNames = incompleteItems.map((item) => item.name).join(', ');
        return NextResponse.json(
          {
            error: 'Cannot complete project with incomplete items',
            details: `The following items must be completed first: ${itemNames}`,
            incompleteItems: incompleteItems.map((item) => ({
              id: item.id,
              name: item.name,
              status: item.status,
            })),
          },
          { status: 400 },
        );
      }
    }

    // Check if color is being updated and validate uniqueness
    if (body.color) {
      const existingProject = await prisma.project.findFirst({
        where: {
          color: body.color,
          NOT: {
            id,
          },
        },
      });

      if (existingProject) {
        return NextResponse.json({ error: 'This color is already used by another project' }, { status: 400 });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        color: body.color,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
      include: {
        items: {
          include: { tasks: { include: { machine: true, operator: true }, orderBy: { createdAt: 'desc' } } },
        },
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    logger.dbError('Update project', 'project', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if project has items
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.items && project.items.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with items. Please delete all items first.' },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.dbError('Delete project', 'project', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
