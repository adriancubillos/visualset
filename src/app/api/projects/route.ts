import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';

// GET /api/projects
export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      items: {
        include: {
          tasks: {
            include: {
              machine: true,
              operator: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return NextResponse.json(projects);
}

// POST /api/projects
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if color is already in use
    if (body.color) {
      const existingProject = await prisma.project.findFirst({
        where: { color: body.color },
      });

      if (existingProject) {
        return NextResponse.json({ error: 'Color is already in use by another project' }, { status: 400 });
      }
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        orderNumber: body.orderNumber || null,
        status: body.status ?? 'ACTIVE',
        color: body.color || null,
        imageUrl: body.imageUrl || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
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
    return NextResponse.json(project);
  } catch (error) {
    logger.dbError('Create project', 'project', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
