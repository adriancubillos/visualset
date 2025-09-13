import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/operators/:id
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const operator = await prisma.operator.update({
    where: { id: params.id },
    data: {
      name: body.name,
      skills: body.skills,
      availability: body.availability,
    },
  });
  return NextResponse.json(operator);
}

// DELETE /api/operators/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.operator.delete({ where: { id: params.id } });
  return NextResponse.json({ message: 'Operator deleted' });
}
