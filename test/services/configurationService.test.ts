import { describe, it, expect, beforeEach, vi } from 'vitest';
import configurationService, { ConfigurationCreateInput } from '@/services/configurationService';
import type { PrismaClient, ConfigurationCategory } from '@prisma/client';

describe('configurationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('listConfigurations calls prisma.configuration.findMany with category', async () => {
    const fake = [
      {
        id: 'c1',
        category: 'AVAILABLE_SKILLS',
        value: 'skill',
        label: 'Skill',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const prisma = { configuration: { findMany: vi.fn().mockResolvedValue(fake) } } as unknown as PrismaClient;

    const res = await configurationService.listConfigurations(prisma, 'AVAILABLE_SKILLS' as ConfigurationCategory);

    expect(prisma.configuration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: 'AVAILABLE_SKILLS' } }),
    );
    expect(res).toEqual(fake);
  });

  it('listConfigurations calls prisma.configuration.findMany without category when none provided', async () => {
    const fake = [
      {
        id: 'c3',
        category: 'TASK_TITLES',
        value: 'title',
        label: 'Title',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const prisma = { configuration: { findMany: vi.fn().mockResolvedValue(fake) } } as unknown as PrismaClient;

    const res = await configurationService.listConfigurations(prisma);

    expect(prisma.configuration.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
    expect(res).toEqual(fake);
  });

  it('createConfiguration calls prisma.configuration.create and returns the created configuration', async () => {
    const input: ConfigurationCreateInput = {
      category: 'TASK_TITLES' as ConfigurationCategory,
      value: 'v',
      label: 'L',
    };
    const returned = { id: 'c2', ...input, createdAt: new Date(), updatedAt: new Date() };

    const prisma = { configuration: { create: vi.fn().mockResolvedValue(returned) } } as unknown as PrismaClient;

    const res = await configurationService.createConfiguration(prisma, input);

    expect(prisma.configuration.create).toHaveBeenCalledWith({ data: input });
    expect(res).toEqual(returned);
  });
});
