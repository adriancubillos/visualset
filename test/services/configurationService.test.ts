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

  describe('updateConfiguration', () => {
    it('should update configuration and cascade skill changes to operators', async () => {
      const configId = 'config-1';
      const existingConfig = {
        id: configId,
        category: 'AVAILABLE_SKILLS' as ConfigurationCategory,
        value: 'WELDING',
        label: 'Welding',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const operatorWithSkill = {
        id: 'op-1',
        name: 'Test Operator',
        skills: ['WELDING', 'MACHINING'],
      };

      const updatedConfig = { ...existingConfig, value: 'ADVANCED_WELDING' };

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          configuration: {
            update: vi.fn().mockResolvedValue(updatedConfig),
          },
          operator: {
            findMany: vi.fn().mockResolvedValue([operatorWithSkill]),
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const prisma = {
        configuration: {
          findUnique: vi.fn().mockResolvedValue(existingConfig),
        },
        $transaction: mockTransaction,
      } as unknown as PrismaClient;

      const result = await configurationService.updateConfiguration(prisma, configId, {
        value: 'ADVANCED_WELDING',
      });

      expect(result).toEqual(updatedConfig);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should throw error if configuration not found', async () => {
      const prisma = {
        configuration: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaClient;

      await expect(
        configurationService.updateConfiguration(prisma, 'non-existent', { value: 'NEW_VALUE' }),
      ).rejects.toThrow('Configuration not found');
    });
  });

  describe('validateAndFixSkillConsistency', () => {
    it('should detect operators with invalid skills', async () => {
      const validSkills = [
        {
          id: '1',
          category: 'AVAILABLE_SKILLS',
          value: 'WELDING',
          label: 'Welding',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          category: 'AVAILABLE_SKILLS',
          value: 'MACHINING',
          label: 'Machining',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const operators = [
        { id: 'op1', name: 'Operator 1', skills: ['WELDING', 'INVALID_SKILL'] },
        { id: 'op2', name: 'Operator 2', skills: ['MACHINING'] },
        { id: 'op3', name: 'Operator 3', skills: ['WELDING', 'ANOTHER_INVALID'] },
      ];

      const prisma = {
        configuration: {
          findMany: vi.fn().mockResolvedValue(validSkills),
        },
        operator: {
          findMany: vi.fn().mockResolvedValue(operators),
        },
      } as unknown as PrismaClient;

      const result = await configurationService.validateAndFixSkillConsistency(prisma);

      expect(result.totalOperatorsChecked).toBe(3);
      expect(result.inconsistenciesFound).toBe(2);
      expect(result.inconsistencies).toHaveLength(2);
      expect(result.inconsistencies[0].invalidSkills).toContain('INVALID_SKILL');
      expect(result.inconsistencies[1].invalidSkills).toContain('ANOTHER_INVALID');
    });
  });

  describe('validateAndFixAllConsistency', () => {
    it('should detect inconsistencies across all configuration types', async () => {
      const configurations = [
        {
          id: '1',
          category: 'AVAILABLE_SKILLS',
          value: 'WELDING',
          label: 'Welding',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          category: 'MACHINE_TYPES',
          value: 'LATHE',
          label: 'Lathe',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          category: 'TASK_TITLES',
          value: 'CUTTING',
          label: 'Cutting',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          category: 'OPERATOR_SHIFTS',
          value: 'DAY_SHIFT',
          label: 'Day Shift',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const operators = [
        { id: 'op1', name: 'Operator 1', skills: ['WELDING', 'INVALID_SKILL'], shift: 'INVALID_SHIFT' },
      ];

      const machines = [{ id: 'm1', name: 'Machine 1', type: 'INVALID_TYPE' }];

      const tasks = [{ id: 't1', title: 'INVALID_TITLE' }];

      const prisma = {
        configuration: {
          findMany: vi.fn().mockImplementation(({ where }) => {
            if (!where) return Promise.resolve(configurations);
            return Promise.resolve(configurations.filter((c) => c.category === where.category));
          }),
        },
        operator: {
          findMany: vi.fn().mockResolvedValue(operators),
        },
        machine: {
          findMany: vi.fn().mockResolvedValue(machines),
        },
        task: {
          findMany: vi.fn().mockResolvedValue(tasks),
        },
      } as unknown as PrismaClient;

      const result = await configurationService.validateAndFixAllConsistency(prisma);

      expect(result.totalEntitiesChecked).toBeGreaterThan(0);
      expect(result.inconsistenciesFound).toBe(4); // 1 invalid skill + 1 invalid shift + 1 invalid type + 1 invalid title
      expect(result.inconsistencies).toHaveLength(4);

      // Check that all entity types are represented
      const entityTypes = result.inconsistencies.map((i) => i.entityType);
      expect(entityTypes).toContain('operator');
      expect(entityTypes).toContain('machine');
      expect(entityTypes).toContain('task');
    });
  });

  describe('updateConfiguration with different categories', () => {
    it('should update machine types and cascade to machines', async () => {
      const configId = 'config-1';
      const existingConfig = {
        id: configId,
        category: 'MACHINE_TYPES' as ConfigurationCategory,
        value: 'LATHE',
        label: 'Lathe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedConfig = { ...existingConfig, value: 'CNC_LATHE' };

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          configuration: {
            update: vi.fn().mockResolvedValue(updatedConfig),
          },
          machine: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      const prisma = {
        configuration: {
          findUnique: vi.fn().mockResolvedValue(existingConfig),
        },
        $transaction: mockTransaction,
      } as unknown as PrismaClient;

      const result = await configurationService.updateConfiguration(prisma, configId, {
        value: 'CNC_LATHE',
      });

      expect(result).toEqual(updatedConfig);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should update task titles and cascade to tasks', async () => {
      const configId = 'config-2';
      const existingConfig = {
        id: configId,
        category: 'TASK_TITLES' as ConfigurationCategory,
        value: 'CUTTING',
        label: 'Cutting',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedConfig = { ...existingConfig, value: 'PRECISION_CUTTING' };

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          configuration: {
            update: vi.fn().mockResolvedValue(updatedConfig),
          },
          task: {
            updateMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        });
      });

      const prisma = {
        configuration: {
          findUnique: vi.fn().mockResolvedValue(existingConfig),
        },
        $transaction: mockTransaction,
      } as unknown as PrismaClient;

      const result = await configurationService.updateConfiguration(prisma, configId, {
        value: 'PRECISION_CUTTING',
      });

      expect(result).toEqual(updatedConfig);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should update operator shifts and cascade to operators', async () => {
      const configId = 'config-3';
      const existingConfig = {
        id: configId,
        category: 'OPERATOR_SHIFTS' as ConfigurationCategory,
        value: 'DAY_SHIFT',
        label: 'Day Shift',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedConfig = { ...existingConfig, value: 'MORNING_SHIFT' };

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          configuration: {
            update: vi.fn().mockResolvedValue(updatedConfig),
          },
          operator: {
            updateMany: vi.fn().mockResolvedValue({ count: 3 }),
          },
        });
      });

      const prisma = {
        configuration: {
          findUnique: vi.fn().mockResolvedValue(existingConfig),
        },
        $transaction: mockTransaction,
      } as unknown as PrismaClient;

      const result = await configurationService.updateConfiguration(prisma, configId, {
        value: 'MORNING_SHIFT',
      });

      expect(result).toEqual(updatedConfig);
      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('deleteConfiguration with different categories', () => {
    it('should prevent deletion of machine type if machines use it', async () => {
      const configId = 'config-1';
      const existingConfig = {
        id: configId,
        category: 'MACHINE_TYPES' as ConfigurationCategory,
        value: 'LATHE',
        label: 'Lathe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const machinesUsingType = [
        { id: 'm1', name: 'Machine 1' },
        { id: 'm2', name: 'Machine 2' },
      ];

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          machine: {
            findMany: vi.fn().mockResolvedValue(machinesUsingType),
          },
        });
      });

      const prisma = {
        configuration: {
          findUnique: vi.fn().mockResolvedValue(existingConfig),
        },
        $transaction: mockTransaction,
      } as unknown as PrismaClient;

      await expect(configurationService.deleteConfiguration(prisma, configId)).rejects.toThrow(
        'Cannot delete "LATHE" - it is assigned to 2 machine(s)',
      );
    });

    it('should prevent deletion of task title if tasks use it', async () => {
      const configId = 'config-2';
      const existingConfig = {
        id: configId,
        category: 'TASK_TITLES' as ConfigurationCategory,
        value: 'CUTTING',
        label: 'Cutting',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tasksUsingTitle = [{ id: 't1', title: 'Task 1' }];

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          task: {
            findMany: vi.fn().mockResolvedValue(tasksUsingTitle),
          },
        });
      });

      const prisma = {
        configuration: {
          findUnique: vi.fn().mockResolvedValue(existingConfig),
        },
        $transaction: mockTransaction,
      } as unknown as PrismaClient;

      await expect(configurationService.deleteConfiguration(prisma, configId)).rejects.toThrow(
        'Cannot delete "CUTTING" - it is assigned to 1 task(s)',
      );
    });
  });
});
