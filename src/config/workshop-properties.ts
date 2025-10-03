// Workshop Properties Configuration
// Centralized definitions for static workshop-related constants
// Note: AVAILABLE_SKILLS, MACHINE_TYPES, TASK_TITLES, TASK_PRIORITY, and OPERATOR_SHIFTS
// are now managed through the database and can be configured via /configuration page

// UI Configuration
export const UI_CONFIG = {
  // Maximum height for dropdown select elements (in pixels)
  // This prevents long dropdowns from extending to the bottom of the page
  // Used by the custom Select component (/src/components/ui/Select.tsx)
  // To change: Simply update this value - it's automatically applied to all Select components
  SELECT_MAX_HEIGHT: 500,
} as const;

export const OPERATOR_STATUS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'TRAINING', label: 'In Training' },
] as const;

export const MACHINE_STATUS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OUT_OF_ORDER', label: 'Out of Order' },
] as const;

export const TASK_STATUS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'BLOCKED', label: 'Blocked' },
] as const;

export const PROJECT_STATUS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const ITEM_STATUS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
] as const;

// Helper functions to get labels by value for static arrays
export const getOperatorStatusLabel = (value: string) =>
  OPERATOR_STATUS.find((status) => status.value === value)?.label || value;

export const getMachineStatusLabel = (value: string) =>
  MACHINE_STATUS.find((status) => status.value === value)?.label || value;

export const getTaskStatusLabel = (value: string) =>
  TASK_STATUS.find((status) => status.value === value)?.label || value;

export const getProjectStatusLabel = (value: string) =>
  PROJECT_STATUS.find((status) => status.value === value)?.label || value;

export const getItemStatusLabel = (value: string) =>
  ITEM_STATUS.find((status) => status.value === value)?.label || value;

// For database-managed configurations, use the helper functions from @/hooks/useConfiguration
// Example:
// import { getConfigurationLabel } from '@/hooks/useConfiguration';
// const label = getConfigurationLabel(configurations, 'CNC_MILL');
