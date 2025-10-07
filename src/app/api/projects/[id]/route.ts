import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import projectService from '@/services/projectService';
import { logger } from '@/utils/logger';
import { mapErrorToResponse } from '@/lib/errors';

// GET /api/projects/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await projectService.getProject(prisma, id);
    return NextResponse.json(project);
  } catch (error) {
    logger.apiError('Fetch project', `/api/projects/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// PUT /api/projects/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const project = await projectService.updateProject(prisma, id, body);
    return NextResponse.json(project);
  } catch (error) {
    logger.apiError('Update project', `/api/projects/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await projectService.deleteProject(prisma, id);
    return NextResponse.json(result);
  } catch (error) {
    logger.apiError('Delete project', `/api/projects/${(await params).id}`, error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
