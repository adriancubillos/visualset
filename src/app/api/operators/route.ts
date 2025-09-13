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
  const body = await req.json();
  const operator = await prisma.operator.create({
    data: {
      name: body.name,
      skills: body.skills ?? [],
      availability: body.availability ?? {},
    },
  });
  return NextResponse.json(operator);
}
