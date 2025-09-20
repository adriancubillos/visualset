import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { color, pattern, entityType, excludeEntityId } = await req.json();

    if (!color || !pattern || !entityType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check operators for conflicts
    const conflictingOperator = await prisma.operator.findFirst({
      where: {
        color,
        pattern,
        ...(excludeEntityId && entityType === 'operator' ? { id: { not: excludeEntityId } } : {}),
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (conflictingOperator) {
      return NextResponse.json({
        isValid: false,
        conflictingEntity: {
          id: conflictingOperator.id,
          name: conflictingOperator.name,
          type: 'operator',
        },
      });
    }

    // Check machines for conflicts
    const conflictingMachine = await prisma.machine.findFirst({
      where: {
        color,
        pattern,
        ...(excludeEntityId && entityType === 'machine' ? { id: { not: excludeEntityId } } : {}),
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (conflictingMachine) {
      return NextResponse.json({
        isValid: false,
        conflictingEntity: {
          id: conflictingMachine.id,
          name: conflictingMachine.name,
          type: 'machine',
        },
      });
    }

    return NextResponse.json({
      isValid: true,
    });
  } catch (error) {
    console.error('Error validating color pattern:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
