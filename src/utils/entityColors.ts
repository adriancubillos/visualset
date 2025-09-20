import React from 'react';

// Color palette for entities - consistent colors with different patterns
export const COLOR_PALETTE = [
  {
    hex: '#ef4444', // Bright Red
    tailwind: 'bg-red-500 border-red-600 hover:bg-red-600',
    pattern: 'solid',
  },
  {
    hex: '#f97316', // Bright Orange
    tailwind: 'bg-orange-500 border-orange-600 hover:bg-orange-600',
    pattern: 'solid',
  },
  {
    hex: '#eab308', // Golden Yellow
    tailwind: 'bg-yellow-500 border-yellow-600 hover:bg-yellow-600',
    pattern: 'solid',
  },
  {
    hex: '#22c55e', // Bright Green
    tailwind: 'bg-green-500 border-green-600 hover:bg-green-600',
    pattern: 'solid',
  },
  {
    hex: '#06b6d4', // Cyan/Turquoise
    tailwind: 'bg-cyan-500 border-cyan-600 hover:bg-cyan-600',
    pattern: 'solid',
  },
  {
    hex: '#3b82f6', // Royal Blue
    tailwind: 'bg-blue-500 border-blue-600 hover:bg-blue-600',
    pattern: 'solid',
  },
  {
    hex: '#8b5cf6', // Purple
    tailwind: 'bg-purple-500 border-purple-600 hover:bg-purple-600',
    pattern: 'solid',
  },
  {
    hex: '#ec4899', // Hot Pink
    tailwind: 'bg-pink-500 border-pink-600 hover:bg-pink-600',
    pattern: 'solid',
  },
  {
    hex: '#84cc16', // Lime Green
    tailwind: 'bg-lime-500 border-lime-600 hover:bg-lime-600',
    pattern: 'solid',
  },
  {
    hex: '#6366f1', // Indigo
    tailwind: 'bg-indigo-500 border-indigo-600 hover:bg-indigo-600',
    pattern: 'solid',
  },
];

// Pattern types for visual differentiation
export const PATTERN_TYPES = {
  solid: 'solid',
  diagonalLeft: 'diagonal-left',
  diagonalRight: 'diagonal-right',
  horizontal: 'horizontal-lines',
  vertical: 'vertical-lines',
} as const;

export type PatternType = keyof typeof PATTERN_TYPES;

interface EntityColorResult {
  hex: string;
  tailwind: string;
  pattern: PatternType;
  style?: React.CSSProperties;
  patternStyle?: React.CSSProperties;
}

interface EntityWithColor {
  id: string;
  color?: string | null;
  pattern?: string | null;
}

/**
 * Generate hash-based color and pattern assignment for consistent entity coloring
 */
function generateEntityHash(id: string, offset = 0): number {
  const hash = id.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return Math.abs(hash + offset);
}

/**
 * Get entity color and pattern with fallback to hash-based assignment
 */
export function getEntityColor(
  entity: EntityWithColor,
  entityType: 'project' | 'operator' | 'machine' = 'project',
): EntityColorResult {
  // Different offsets for different entity types to ensure visual distinction
  const typeOffsets = {
    project: 0,
    operator: 1000,
    machine: 2000,
  };

  const hash = generateEntityHash(entity.id, typeOffsets[entityType]);
  const colorIndex = hash % COLOR_PALETTE.length;
  const patternIndex = Math.floor(hash / COLOR_PALETTE.length) % Object.keys(PATTERN_TYPES).length;

  const defaultColor = COLOR_PALETTE[colorIndex];
  const defaultPattern = Object.keys(PATTERN_TYPES)[patternIndex] as PatternType;

  // Use entity's custom color/pattern if available
  const finalColor = entity.color || defaultColor.hex;
  const finalPattern = (entity.pattern as PatternType) || defaultPattern;

  const result: EntityColorResult = {
    hex: finalColor,
    tailwind: entity.color ? '' : defaultColor.tailwind,
    pattern: finalPattern,
  };

  // For custom colors, provide inline styles
  if (entity.color) {
    result.style = {
      backgroundColor: finalColor,
      borderLeftColor: finalColor,
    };
  }

  // Add pattern-specific styles
  result.patternStyle = getPatternStyles(finalColor, finalPattern);

  return result;
}

/**
 * Generate CSS styles for different patterns
 */
function getPatternStyles(color: string, pattern: PatternType): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    backgroundColor: color,
  };

  switch (pattern) {
    case 'solid':
      return baseStyle;

    case 'diagonalLeft':
      return {
        backgroundColor: adjustColorOpacity(color, 0.3),
        backgroundImage: `repeating-linear-gradient(
          135deg,
          transparent,
          transparent 2px,
          ${color} 2px,
          ${color} 4px
        )`,
      };

    case 'diagonalRight':
      return {
        backgroundColor: adjustColorOpacity(color, 0.3),
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2px,
          ${color} 2px,
          ${color} 4px
        )`,
      };

    case 'horizontal':
      return {
        backgroundColor: adjustColorOpacity(color, 0.3),
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          ${color} 2px,
          ${color} 4px
        )`,
      };

    case 'vertical':
      return {
        backgroundColor: adjustColorOpacity(color, 0.3),
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 2px,
          ${color} 2px,
          ${color} 4px
        )`,
      };

    default:
      return baseStyle;
  }
}

/**
 * Adjust color opacity for pattern effects
 */
function adjustColorOpacity(hexColor: string, opacity: number): string {
  // Convert hex to rgba
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Legacy function for backward compatibility with existing project color usage
 */
export function getProjectColor(project: { id: string; color?: string | null }): {
  hex: string;
  tailwind: string;
  style?: React.CSSProperties;
} {
  const result = getEntityColor(project, 'project');
  return {
    hex: result.hex,
    tailwind: result.tailwind,
    style: result.style,
  };
}

/**
 * Get operator color and pattern
 */
export function getOperatorColor(operator: EntityWithColor): EntityColorResult {
  return getEntityColor(operator, 'operator');
}

/**
 * Get machine color and pattern
 */
export function getMachineColor(machine: EntityWithColor): EntityColorResult {
  return getEntityColor(machine, 'machine');
}
