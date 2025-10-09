import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import itemService from '@/services/itemService';
import { mapErrorToResponse } from '@/lib/errors';

// Helper function to transform task data from junction table format to API format
function transformTaskWithRelations(task: {
  taskMachines?: Array<{ machine: { id: string; name: string } }>;
  taskOperators?: Array<{ operator: { id: string; name: string } }>;
  [key: string]: unknown;
}) {
  return {
    ...task,
    machines: task.taskMachines?.map((tm) => tm.machine) || [],
    operators: task.taskOperators?.map((to) => to.operator) || [],
    // Remove the junction table fields
    taskMachines: undefined,
    taskOperators: undefined,
  };
}

// GET /api/items/[id]
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const item = await itemService.getItem(prisma, id);

    // Transform task data to include machines and operators arrays
    const transformedItem = {
      ...item,
      tasks: item.tasks.map(transformTaskWithRelations),
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    logger.apiError('Fetch item', '/api/items/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// PUT /api/items/[id]
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const item = await itemService.updateItem(prisma, id, body);
    return NextResponse.json(item);
  } catch (error) {
    logger.apiError('Update item', '/api/items/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

// DELETE /api/items/[id]
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await itemService.deleteItem(prisma, id);
    return NextResponse.json(result);
  } catch (error) {
    logger.apiError('Delete item', '/api/items/[id]', error);
    const mapped = mapErrorToResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
