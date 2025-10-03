import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function POST(req: Request) {
  try {
    const { color, pattern, entityType, excludeEntityId } = await req.json();

    if (!color || !pattern || !entityType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for conflicts only within the same entity type
    if (entityType === 'operator') {
      // Check operators for conflicts (operators can't use combinations from other operators)
      const conflictingOperator = await prisma.operator.findFirst({
        where: {
          color,
          pattern,
          ...(excludeEntityId ? { id: { not: excludeEntityId } } : {}),
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
    } else if (entityType === 'machine') {
      // Check machines for conflicts (machines can't use combinations from other machines)
      const conflictingMachine = await prisma.machine.findFirst({
        where: {
          color,
          pattern,
          ...(excludeEntityId ? { id: { not: excludeEntityId } } : {}),
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
    }

    return NextResponse.json({
      isValid: true,
    });
  } catch (error) {
    logger.error('Error validating color pattern', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
