import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/projects
export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        include: {
          machine: true,
          operator: true,
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
        where: { color: body.color }
      });
      
      if (existingProject) {
        return NextResponse.json(
          { error: 'Color is already in use by another project' },
          { status: 400 }
        );
      }
    }
    
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status ?? 'ACTIVE',
        color: body.color || null,
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
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
