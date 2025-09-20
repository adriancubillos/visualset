import React from 'react';

// Color palette for entities - consistent colors with different patterns
export const COLOR_PALETTE = [
  {
    hex: '#3b82f6',
    tailwind: 'bg-blue-500 border-blue-600 hover:bg-blue-600',
    pattern: 'solid',
  },
  {
    hex: '#10b981',
    tailwind: 'bg-green-500 border-green-600 hover:bg-green-600',
    pattern: 'solid',
  },
  {
    hex: '#8b5cf6',
    tailwind: 'bg-purple-500 border-purple-600 hover:bg-purple-600',
    pattern: 'solid',
  },
  {
    hex: '#f59e0b',
    tailwind: 'bg-orange-500 border-orange-600 hover:bg-orange-600',
    pattern: 'solid',
  },
  {
    hex: '#ec4899',
    tailwind: 'bg-pink-500 border-pink-600 hover:bg-pink-600',
    pattern: 'solid',
  },
  {
    hex: '#6366f1',
    tailwind: 'bg-indigo-500 border-indigo-600 hover:bg-indigo-600',
    pattern: 'solid',
  },
  {
    hex: '#ef4444',
    tailwind: 'bg-red-500 border-red-600 hover:bg-red-600',
    pattern: 'solid',
  },
  {
    hex: '#06b6d4',
    tailwind: 'bg-cyan-500 border-cyan-600 hover:bg-cyan-600',
    pattern: 'solid',
  },
];

// Pattern types for visual differentiation
export const PATTERN_TYPES = {
  solid: 'solid',
  striped: 'striped-diagonal',
  dotted: 'dotted',
  dashed: 'dashed-border',
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

    case 'striped':
      return {
        ...baseStyle,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          ${color},
          ${color} 4px,
          ${adjustColorOpacity(color, 0.7)} 4px,
          ${adjustColorOpacity(color, 0.7)} 8px
        )`,
      };

    case 'dotted':
      return {
        ...baseStyle,
        backgroundImage: `radial-gradient(
          circle at 2px 2px,
          ${adjustColorOpacity(color, 0.8)} 1px,
          transparent 1px
        )`,
        backgroundSize: '8px 8px',
      };

    case 'dashed':
      return {
        ...baseStyle,
        borderStyle: 'dashed',
        borderWidth: '2px',
        borderColor: adjustColorOpacity(color, 0.8),
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
