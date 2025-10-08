import type { PrismaClient } from '@prisma/client';
import { ConfigurationCategory } from '@prisma/client';
import { ApiError } from '@/lib/errors';

export type ConfigurationCreateInput = {
  category: ConfigurationCategory;
  value: string;
  label: string;
};

export type ConfigurationUpdateInput = {
  value?: string;
  label?: string;
};

// Configuration to entity field mapping
type ConfigurationMapping = {
  model: string;
  field: string;
  isArray: boolean;
  filterField?: string; // For special filtering logic
};

const CONFIGURATION_MAPPINGS: Record<ConfigurationCategory, ConfigurationMapping | null> = {
  [ConfigurationCategory.AVAILABLE_SKILLS]: {
    model: 'operator',
    field: 'skills',
    isArray: true,
  },
  [ConfigurationCategory.MACHINE_TYPES]: {
    model: 'machine',
    field: 'type',
    isArray: false,
  },
  [ConfigurationCategory.TASK_TITLES]: {
    model: 'task',
    field: 'title',
    isArray: false,
  },
  [ConfigurationCategory.TASK_PRIORITY]: null, // Not stored in database currently
  [ConfigurationCategory.OPERATOR_SHIFTS]: {
    model: 'operator',
    field: 'shift',
    isArray: false,
  },
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

export async function updateConfiguration(prisma: PrismaClient, id: string, data: ConfigurationUpdateInput) {
  const existing = await prisma.configuration.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError({
      code: 'CONFIGURATION_NOT_FOUND',
      message: 'Configuration not found',
      status: 404,
    });
  }

  const oldValue = existing.value;
  const newValue = data.value ?? existing.value;

  // Use transaction to ensure consistency
  return await prisma.$transaction(async (tx) => {
    // Update the configuration
    const updatedConfig = await tx.configuration.update({
      where: { id },
      data: {
        value: newValue,
        label: data.label ?? existing.label,
      },
    });

    // If value changed, update all entities that reference this configuration
    if (oldValue !== newValue) {
      const mapping = CONFIGURATION_MAPPINGS[existing.category];

      if (mapping) {
        await updateReferencingEntities(tx, mapping, oldValue, newValue);
      }
    }

    return updatedConfig;
  });
}

/**
 * Generic function to update entities that reference a configuration value
 */
async function updateReferencingEntities(
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  mapping: ConfigurationMapping,
  oldValue: string,
  newValue: string,
) {
  const { model, field, isArray } = mapping;

  if (isArray) {
    // Handle array fields (like skills)
    let entities: Array<{ id: string; [key: string]: unknown }> = [];

    if (model === 'operator') {
      entities = await tx.operator.findMany({
        where: {
          [field]: {
            has: oldValue,
          },
        },
      });
    }

    // Update each entity's array field
    for (const entity of entities) {
      const currentArray = entity[field] as string[];
      const updatedArray = currentArray.map((value: string) => (value === oldValue ? newValue : value));

      if (model === 'operator') {
        await tx.operator.update({
          where: { id: entity.id },
          data: { [field]: updatedArray },
        });
      }
    }
  } else {
    // Handle scalar fields (like type, title, shift)
    if (model === 'machine') {
      await tx.machine.updateMany({
        where: { [field]: oldValue },
        data: { [field]: newValue },
      });
    } else if (model === 'task') {
      await tx.task.updateMany({
        where: { [field]: oldValue },
        data: { [field]: newValue },
      });
    } else if (model === 'operator') {
      await tx.operator.updateMany({
        where: { [field]: oldValue },
        data: { [field]: newValue },
      });
    }
  }
}

export async function deleteConfiguration(prisma: PrismaClient, id: string) {
  const existing = await prisma.configuration.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError({
      code: 'CONFIGURATION_NOT_FOUND',
      message: 'Configuration not found',
      status: 404,
    });
  }

  // Use transaction to ensure consistency
  return await prisma.$transaction(async (tx) => {
    const mapping = CONFIGURATION_MAPPINGS[existing.category];

    if (mapping) {
      // Check if any entities use this configuration value
      const entitiesUsingValue = await checkReferencingEntities(tx, mapping, existing.value);

      if (entitiesUsingValue.length > 0) {
        const entityType = getEntityTypeName(mapping.model);
        throw new ApiError({
          code: 'CONFIGURATION_IN_USE',
          message: `Cannot delete "${existing.value}" - it is assigned to ${entitiesUsingValue.length} ${entityType}(s)`,
          status: 400,
        });
      }
    }

    // Delete the configuration
    await tx.configuration.delete({ where: { id } });
    return { message: 'Configuration deleted successfully' };
  });
}

/**
 * Check which entities are currently using a configuration value
 */
async function checkReferencingEntities(
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  mapping: ConfigurationMapping,
  value: string,
): Promise<Array<{ id: string; name?: string }>> {
  const { model, field, isArray } = mapping;

  if (isArray) {
    // Handle array fields (like skills)
    if (model === 'operator') {
      return await tx.operator.findMany({
        where: {
          [field]: {
            has: value,
          },
        },
        select: { id: true, name: true },
      });
    }
  } else {
    // Handle scalar fields (like type, title, shift)
    if (model === 'machine') {
      return await tx.machine.findMany({
        where: { [field]: value },
        select: { id: true, name: true },
      });
    } else if (model === 'task') {
      return await tx.task.findMany({
        where: { [field]: value },
        select: { id: true, title: true },
      });
    } else if (model === 'operator') {
      return await tx.operator.findMany({
        where: { [field]: value },
        select: { id: true, name: true },
      });
    }
  }

  return [];
}

/**
 * Get human-readable entity type name
 */
function getEntityTypeName(model: string): string {
  switch (model) {
    case 'operator':
      return 'operator';
    case 'machine':
      return 'machine';
    case 'task':
      return 'task';
    default:
      return 'entity';
  }
}

/**
 * Utility function to fix any existing data inconsistencies.
 * This can be run as a one-time cleanup or periodically.
 */
export async function validateAndFixAllConsistency(prisma: PrismaClient) {
  const allInconsistencies: Array<{
    category: ConfigurationCategory;
    entityType: string;
    entityId: string;
    entityName: string;
    invalidValues: string[];
  }> = [];

  let totalEntitiesChecked = 0;

  // Check each configuration category
  for (const category of Object.values(ConfigurationCategory)) {
    const mapping = CONFIGURATION_MAPPINGS[category];
    if (!mapping) continue;

    // Get all valid values for this category
    const configurations = await prisma.configuration.findMany({
      where: { category },
    });
    const validValues = new Set(configurations.map((config) => config.value));

    // Check entities for this category
    const { inconsistencies, entitiesChecked } = await validateCategoryConsistency(
      prisma,
      mapping,
      validValues,
      category,
    );

    allInconsistencies.push(...inconsistencies);
    totalEntitiesChecked += entitiesChecked;
  }

  return {
    totalEntitiesChecked,
    inconsistenciesFound: allInconsistencies.length,
    inconsistencies: allInconsistencies,
  };
}

/**
 * Validate consistency for a specific category
 */
async function validateCategoryConsistency(
  prisma: PrismaClient,
  mapping: ConfigurationMapping,
  validValues: Set<string>,
  category: ConfigurationCategory,
) {
  const { model, field, isArray } = mapping;
  const inconsistencies: Array<{
    category: ConfigurationCategory;
    entityType: string;
    entityId: string;
    entityName: string;
    invalidValues: string[];
  }> = [];

  let entities: Array<{ id: string; name?: string; title?: string; [key: string]: unknown }> = [];

  // Get entities with non-empty values for this field
  if (isArray) {
    if (model === 'operator') {
      entities = await prisma.operator.findMany({
        where: {
          skills: {
            isEmpty: false,
          },
        },
      });
    }
  } else {
    // For scalar fields, get entities where field is not null
    if (model === 'machine') {
      entities = await prisma.machine.findMany({
        where: {
          [field]: {
            not: null,
          },
        },
      });
    } else if (model === 'task') {
      entities = await prisma.task.findMany({
        where: {
          [field]: {
            not: null,
          },
        },
      });
    } else if (model === 'operator') {
      entities = await prisma.operator.findMany({
        where: {
          [field]: {
            not: null,
          },
        },
      });
    }
  }

  // Check for inconsistencies
  for (const entity of entities) {
    const entityName = (entity.name as string) || (entity.title as string) || `${model}-${entity.id}`;
    let invalidValues: string[] = [];

    if (isArray) {
      const arrayValues = entity[field] as string[];
      invalidValues = arrayValues.filter((value) => !validValues.has(value));
    } else {
      const scalarValue = entity[field] as string;
      if (scalarValue && !validValues.has(scalarValue)) {
        invalidValues = [scalarValue];
      }
    }

    if (invalidValues.length > 0) {
      inconsistencies.push({
        category,
        entityType: getEntityTypeName(model),
        entityId: entity.id,
        entityName,
        invalidValues,
      });
    }
  }

  return {
    inconsistencies,
    entitiesChecked: entities.length,
  };
}

/**
 * Legacy function for backward compatibility - validates only skills
 * @deprecated Use validateAndFixAllConsistency instead
 */
export async function validateAndFixSkillConsistency(prisma: PrismaClient) {
  // Get all available skills from configurations
  const skillConfigs = await prisma.configuration.findMany({
    where: { category: ConfigurationCategory.AVAILABLE_SKILLS },
  });
  const validSkills = new Set(skillConfigs.map((config) => config.value));

  // Get all operators with skills
  const operators = await prisma.operator.findMany({
    where: {
      skills: {
        isEmpty: false,
      },
    },
  });

  const inconsistencies: Array<{
    operatorId: string;
    operatorName: string;
    invalidSkills: string[];
  }> = [];

  // Check for inconsistencies
  for (const operator of operators) {
    const invalidSkills = operator.skills.filter((skill) => !validSkills.has(skill));
    if (invalidSkills.length > 0) {
      inconsistencies.push({
        operatorId: operator.id,
        operatorName: operator.name,
        invalidSkills,
      });
    }
  }

  return {
    totalOperatorsChecked: operators.length,
    inconsistenciesFound: inconsistencies.length,
    inconsistencies,
  };
}

const exported = {
  listConfigurations,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
  validateAndFixAllConsistency,
  validateAndFixSkillConsistency, // Legacy function for backward compatibility
};

export default exported;
