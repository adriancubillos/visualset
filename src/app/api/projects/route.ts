import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import projectService from '@/services/projectService';
import { logger } from '@/utils/logger';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/projects
export async function GET() {
  try {
    const projects = await projectService.listProjects(prisma);
    return NextResponse.json(projects);
  } catch (error) {
    logger.apiError('Fetch projects', '/api/projects', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// POST /api/projects
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project = await projectService.createProject(prisma, body);
    return NextResponse.json(project);
  } catch (error) {
    logger.apiError('Create project', '/api/projects', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
