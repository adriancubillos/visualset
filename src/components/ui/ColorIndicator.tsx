import React from 'react';
import { getEntityColor } from '@/utils/entityColors';

interface ColorIndicatorProps {
  entity: {
    id: string;
    color?: string | null;
    pattern?: string | null;
  };
  entityType: 'project' | 'operator' | 'machine';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square' | 'bar';
  className?: string;
  showTooltip?: boolean;
  tooltipText?: string;
}

const SIZE_CLASSES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

const SHAPE_CLASSES = {
  circle: 'rounded-full',
  square: 'rounded-sm',
  bar: 'rounded-none h-2 w-8',
};

export default function ColorIndicator({
  entity,
  entityType,
  size = 'md',
  shape = 'circle',
  className = '',
  showTooltip = false,
  tooltipText,
}: ColorIndicatorProps) {
  const colorInfo = getEntityColor(entity, entityType);

  const baseClasses = `
    inline-block border
    ${SIZE_CLASSES[size]}
    ${SHAPE_CLASSES[shape]}
    ${colorInfo.tailwind}
    ${className}
  `.trim();

  const combinedStyle = {
    ...colorInfo.style,
    ...colorInfo.patternStyle,
  };

  const indicator = (
    <div
      className={baseClasses}
      style={combinedStyle}
      title={showTooltip ? tooltipText || `${entityType} color` : undefined}
    />
  );

  return indicator;
}

// Specialized components for specific entity types
export function ProjectColorIndicator({
  project,
  ...props
}: Omit<ColorIndicatorProps, 'entity' | 'entityType'> & {
  project: ColorIndicatorProps['entity'];
}) {
  return (
    <ColorIndicator
      entity={project}
      entityType="project"
      tooltipText={`Project color`}
      {...props}
    />
  );
}

export function OperatorColorIndicator({
  operator,
  ...props
}: Omit<ColorIndicatorProps, 'entity' | 'entityType'> & {
  operator: ColorIndicatorProps['entity'];
}) {
  return (
    <ColorIndicator
      entity={operator}
      entityType="operator"
      tooltipText={`Operator color`}
      {...props}
    />
  );
}

export function MachineColorIndicator({
  machine,
  ...props
}: Omit<ColorIndicatorProps, 'entity' | 'entityType'> & {
  machine: ColorIndicatorProps['entity'];
}) {
  return (
    <ColorIndicator
      entity={machine}
      entityType="machine"
      tooltipText={`Machine color`}
      {...props}
    />
  );
}
