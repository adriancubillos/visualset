import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/operators
export async function GET() {
  const operators = await prisma.operator.findMany();
  return NextResponse.json(operators);
}

// POST /api/operators
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const operator = await prisma.operator.create({
      data: {
        name: body.name,
        email: body.email || null,
        skills: body.skills ?? [],
        status: body.status ?? 'ACTIVE',
        shift: body.shift || null,
        color: body.color || null,
        pattern: body.pattern || null,
        availability: body.availability ?? {},
      },
    });
    return NextResponse.json(operator);
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json({ error: 'Failed to create operator' }, { status: 500 });
  }
}
