import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/tasks/:id
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      title: body.title,
      description: body.description,
      durationMin: body.durationMin,
      status: body.status,
      machineId: body.machineId,
      operatorId: body.operatorId,
      scheduledAt: body.scheduledAt,
    },
    include: {
      machine: true,
      operator: true,
    },
  });
  return NextResponse.json(task);
}

// DELETE /api/tasks/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ message: 'Task deleted' });
}
