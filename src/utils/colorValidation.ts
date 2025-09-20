// Validation utilities for color and pattern combinations

export interface EntityColorCombination {
  color: string;
  pattern: string;
}

export interface ValidationResult {
  isValid: boolean;
  conflictingEntity?: {
    id: string;
    name: string;
    type: 'operator' | 'machine';
  };
}

/**
 * Check if a color/pattern combination is already used by another entity
 */
export async function validateColorPatternUniqueness(
  color: string,
  pattern: string,
  entityType: 'operator' | 'machine',
  excludeEntityId?: string,
): Promise<ValidationResult> {
  try {
    const response = await fetch('/api/validate-color-pattern', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        color,
        pattern,
        entityType,
        excludeEntityId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate color pattern');
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating color pattern:', error);
    return { isValid: false };
  }
}

/**
 * Format validation error message
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.isValid) return '';

  if (result.conflictingEntity) {
    return `This color and pattern combination is already used by ${result.conflictingEntity.type} "${result.conflictingEntity.name}". Please select a different combination.`;
  }

  return 'This color and pattern combination is already in use. Please select a different combination.';
}
