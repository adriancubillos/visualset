import type { PrismaClient } from '@prisma/client';
import { ConfigurationCategory } from '@prisma/client';

export type ConfigurationCreateInput = {
  category: ConfigurationCategory;
  value: string;
  label: string;
};

export async function listConfigurations(prisma: PrismaClient, category?: ConfigurationCategory | null) {
  return prisma.configuration.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: 'asc' }, { label: 'asc' }],
  });
}

export async function createConfiguration(prisma: PrismaClient, data: ConfigurationCreateInput) {
  return prisma.configuration.create({ data });
}

const exported = {
  listConfigurations,
  createConfiguration,
};

export default exported;
