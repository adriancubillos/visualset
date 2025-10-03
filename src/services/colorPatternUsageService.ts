import { PrismaClient } from '@prisma/client';

export type UsedCombination = {
  color: string;
  pattern: string;
  entityName: string | null;
  entityId: string;
  entityType: string;
};

export type FetchOptions = {
  excludeEntityId?: string | null;
};

export type EntityFetcher = (prisma: PrismaClient, opts: FetchOptions) => Promise<UsedCombination[]>;

const registry = new Map<string, EntityFetcher>();

export function registerEntityFetcher(entityType: string, fetcher: EntityFetcher) {
  registry.set(entityType, fetcher);
}

export async function fetchUsedCombinations(prisma: PrismaClient, entityType: string, opts: FetchOptions = {}) {
  const fetcher = registry.get(entityType);
  if (!fetcher) {
    throw new Error(`Unsupported entityType: ${entityType}`);
  }

  return fetcher(prisma, opts);
}

// Default fetchers for existing entity types
registerEntityFetcher('operator', async (prisma, { excludeEntityId }) => {
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

  return operatorCombinations.map((op) => ({
    color: op.color!,
    pattern: op.pattern!,
    entityName: op.name ?? null,
    entityId: op.id,
    entityType: 'operator',
  }));
});

registerEntityFetcher('machine', async (prisma, { excludeEntityId }) => {
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

  return machineCombinations.map((machine) => ({
    color: machine.color!,
    pattern: machine.pattern!,
    entityName: machine.name ?? null,
    entityId: machine.id,
    entityType: 'machine',
  }));
});

const exported = {
  registerEntityFetcher,
  fetchUsedCombinations,
};

export default exported;
