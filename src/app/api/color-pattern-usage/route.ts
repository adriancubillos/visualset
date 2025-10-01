import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const excludeEntityId = searchParams.get('excludeEntityId');
    const entityType = searchParams.get('entityType');

    if (!entityType) {
      return NextResponse.json({ error: 'entityType is required' }, { status: 400 });
    }

    // Only get combinations from the same entity type (operators can't conflict with other operators, machines can't conflict with other machines)
    if (entityType === 'operator') {
      const operatorCombinations = await prisma.operator.findMany({
        where: {
          color: { not: null },
          pattern: { not: null },
          ...(excludeEntityId ? { id: { not: excludeEntityId } } : {}),
        },
        select: {
          color: true,
          pattern: true,
          name: true,
          id: true,
        },
      });

      const usedCombinations = operatorCombinations.map((op) => ({
        color: op.color,
        pattern: op.pattern,
        entityName: op.name,
        entityId: op.id,
        entityType: 'operator' as const,
      }));

      return NextResponse.json({
        usedCombinations,
      });
    } else if (entityType === 'machine') {
      const machineCombinations = await prisma.machine.findMany({
        where: {
          color: { not: null },
          pattern: { not: null },
          ...(excludeEntityId ? { id: { not: excludeEntityId } } : {}),
        },
        select: {
          color: true,
          pattern: true,
          name: true,
          id: true,
        },
      });

      const usedCombinations = machineCombinations.map((machine) => ({
        color: machine.color,
        pattern: machine.pattern,
        entityName: machine.name,
        entityId: machine.id,
        entityType: 'machine' as const,
      }));

      return NextResponse.json({
        usedCombinations,
      });
    } else {
      return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error fetching color pattern usage,', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
