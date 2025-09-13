import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/projects/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        include: {
          machine: true,
          operator: true,
        },
        orderBy: {
          createdAt: 'desc',
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
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  
  try {
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
      include: {
        tasks: {
          include: {
            machine: true,
            operator: true,
          },
        },
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.project.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
}
