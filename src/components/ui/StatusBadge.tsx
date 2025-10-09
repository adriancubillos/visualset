'use client';

import { getVariantClasses, StatusVariant, getStatusVariant } from '@/utils/statusStyles';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export default function StatusBadge({ status, variant, size = 'md' }: StatusBadgeProps) {
  const effectiveVariant = variant || getStatusVariant(status);
  // Use the 'current' style mapping for badges to match Items column styles
  const classes = getVariantClasses(effectiveVariant, true);

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${classes} ${sizeStyles[size]}`}>{status}</span>
  );
}
