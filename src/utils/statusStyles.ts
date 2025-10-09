export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'scheduled';

// Central mapping from semantic status values to UI variant names used by StatusBadge
export const STATUS_VARIANTS: Record<string, StatusVariant> = {
  // Tasks
  COMPLETED: 'success',
  ACTIVE: 'info',
  IN_PROGRESS: 'info',
  SCHEDULED: 'scheduled',
  ON_HOLD: 'warning',
  PENDING: 'warning',
  BLOCKED: 'error',

  // Machines
  AVAILABLE: 'success',
  IN_USE: 'info',
  MAINTENANCE: 'warning',
  OFFLINE: 'error',

  // Projects / Items / Operators can reuse the same mapping where appropriate
};

export function getStatusVariant(status?: string): StatusVariant {
  if (!status) return 'default';
  const key = String(status).toUpperCase();
  return STATUS_VARIANTS[key] || 'default';
}

// Map UI variant to Tailwind class snippets for buttons/badges.
// These classes match the styles used in the Items page status column
export const VARIANT_CLASS_MAP: Record<StatusVariant, { current: string; normal: string }> = {
  default: {
    current: 'bg-gray-200 text-gray-900 border-2 border-gray-500',
    normal: 'bg-gray-200 text-gray-900 border-2 border-gray-500',
  },
  success: {
    current: 'bg-green-200 text-green-900 border-2 border-green-500',
    normal: 'bg-green-200 text-green-900 border-2 border-green-500',
  },
  scheduled: {
    current: 'bg-purple-200 text-purple-900 border-2 border-purple-500',
    normal: 'bg-purple-200 text-purple-900 border-2 border-purple-500',
  },
  warning: {
    current: 'bg-yellow-200 text-yellow-900 border-2 border-yellow-500',
    normal: 'bg-yellow-200 text-yellow-900 border-2 border-yellow-500',
  },
  error: {
    current: 'bg-red-200 text-red-900 border-2 border-red-500',
    normal: 'bg-red-200 text-red-900 border-2 border-red-500',
  },
  info: {
    current: 'bg-blue-200 text-blue-900 border-2 border-blue-500',
    normal: 'bg-blue-200 text-blue-900 border-2 border-blue-500',
  },
};

export function getVariantClasses(variant: StatusVariant, isCurrent: boolean): string {
  const mapping = VARIANT_CLASS_MAP[variant] || VARIANT_CLASS_MAP.default;
  return isCurrent ? mapping.current : mapping.normal;
}
