import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/operators/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const operator = await prisma.operator.findUnique({
      where: { id: params.id },
    });

    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    return NextResponse.json(operator);
  } catch (error) {
    console.error('Error fetching operator:', error);
    return NextResponse.json({ error: 'Failed to fetch operator' }, { status: 500 });
  }
}

// PUT /api/operators/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const operator = await prisma.operator.update({
      where: { id: params.id },
      data: {
        name: body.name,
        email: body.email,
        skills: body.skills,
        status: body.status,
        shift: body.shift,
        availability: body.availability,
      },
    });
    return NextResponse.json(operator);
  } catch (error) {
    console.error('Error updating operator:', error);
    return NextResponse.json({ error: 'Failed to update operator' }, { status: 500 });
  }
}

// DELETE /api/operators/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.operator.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json({ error: 'Failed to delete operator' }, { status: 500 });
  }
}
