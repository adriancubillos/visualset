// Validation utilities for color and pattern combinations
import { PatternType } from './entityColors';

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

export interface UsedColorCombination {
  color: string;
  pattern: string;
  entityName: string;
  entityId: string;
  entityType: 'operator' | 'machine';
}

export interface ColorPatternAvailability {
  usedCombinations: UsedColorCombination[];
  availablePatterns: Record<string, PatternType[]>;
  availableColors: string[];
}

/**
 * Get all used color/pattern combinations and calculate availability
 */
export async function getColorPatternAvailability(
  entityType: 'operator' | 'machine',
  excludeEntityId?: string,
): Promise<ColorPatternAvailability> {
  try {
    const params = new URLSearchParams();
    if (excludeEntityId) params.append('excludeEntityId', excludeEntityId);
    if (entityType) params.append('entityType', entityType);

    const response = await fetch(`/api/color-pattern-usage?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch color pattern usage');
    }

    const data = await response.json();
    return processAvailability(data.usedCombinations);
  } catch (error) {
    console.error('Error fetching color pattern availability:', error);
    return {
      usedCombinations: [],
      availablePatterns: {},
      availableColors: [],
    };
  }
}

/**
 * Process used combinations to determine what's available
 */
function processAvailability(usedCombinations: UsedColorCombination[]): ColorPatternAvailability {
  const allPatterns: PatternType[] = ['solid', 'diagonalLeft', 'diagonalRight', 'horizontal', 'vertical'];

  // Group used combinations by color
  const usedByColor: Record<string, PatternType[]> = {};

  usedCombinations.forEach((combo) => {
    if (!usedByColor[combo.color]) {
      usedByColor[combo.color] = [];
    }
    usedByColor[combo.color].push(combo.pattern as PatternType);
  });

  // Calculate available patterns for each color
  const availablePatterns: Record<string, PatternType[]> = {};
  const availableColors: string[] = [];

  // For each color in the palette, determine available patterns
  Object.keys(usedByColor).forEach((color) => {
    const usedPatterns = usedByColor[color];
    const available = allPatterns.filter((pattern) => !usedPatterns.includes(pattern));

    if (available.length > 0) {
      availablePatterns[color] = available;
      availableColors.push(color);
    }
  });

  // For colors not in usedByColor, all patterns are available
  // We'll need to get the full color palette to determine this
  // For now, we'll add logic in the component to handle this

  return {
    usedCombinations,
    availablePatterns,
    availableColors,
  };
}

/**
 * Check if a specific color/pattern combination is available
 */
export function isColorPatternAvailable(
  color: string,
  pattern: PatternType,
  availability: ColorPatternAvailability,
): boolean {
  return !availability.usedCombinations.some((combo) => combo.color === color && combo.pattern === pattern);
}

/**
 * Check if a color has any available patterns
 */
export function isColorAvailable(color: string, availability: ColorPatternAvailability): boolean {
  const allPatterns: PatternType[] = ['solid', 'diagonalLeft', 'diagonalRight', 'horizontal', 'vertical'];
  const usedPatterns = availability.usedCombinations
    .filter((combo) => combo.color === color)
    .map((combo) => combo.pattern as PatternType);

  return usedPatterns.length < allPatterns.length;
}

/**
 * Get available patterns for a specific color
 */
export function getAvailablePatternsForColor(color: string, availability: ColorPatternAvailability): PatternType[] {
  const allPatterns: PatternType[] = ['solid', 'diagonalLeft', 'diagonalRight', 'horizontal', 'vertical'];
  const usedPatterns = availability.usedCombinations
    .filter((combo) => combo.color === color)
    .map((combo) => combo.pattern as PatternType);

  return allPatterns.filter((pattern) => !usedPatterns.includes(pattern));
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
