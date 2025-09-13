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
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
      status: body.status ?? 'ACTIVE',
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
}
