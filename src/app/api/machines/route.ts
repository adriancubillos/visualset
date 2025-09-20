import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/machines
export async function GET() {
  const machines = await prisma.machine.findMany();
  return NextResponse.json(machines);
}

// POST /api/machines
export async function POST(req: Request) {
  const body = await req.json();
  const machine = await prisma.machine.create({
    data: {
      name: body.name,
      type: body.type,
      status: body.status ?? 'AVAILABLE',
      location: body.location,
      color: body.color,
      pattern: body.pattern,
    },
  });
  return NextResponse.json(machine);
}
