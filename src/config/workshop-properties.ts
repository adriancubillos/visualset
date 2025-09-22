// Workshop Properties Configuration
// Centralized definitions for skills, machine types, and other workshop-related constants

export const AVAILABLE_SKILLS = [
  { value: 'CNC_MILL', label: 'CNC Mill' },
  { value: 'CNC_LATHE', label: 'CNC Lathe' },
  { value: 'WELDING', label: 'Welding' },
  { value: 'GRINDER', label: 'Grinder' },
  { value: 'DRILL_PRESS', label: 'Drill Press' },
  { value: 'BANDSAW', label: 'Bandsaw' },
  { value: 'ASSEMBLY', label: 'Assembly' },
  { value: 'QUALITY_CONTROL', label: 'Quality Control' },
  { value: '3D_PRINTING', label: '3D Printing' },
  { value: 'LASER_CUTTING', label: 'Laser Cutting' },
  { value: 'PLASMA_CUTTING', label: 'Plasma Cutting' },
  { value: 'SHEET_METAL', label: 'Sheet Metal' },
] as const;

export const MACHINE_TYPES = [
  { value: 'CNC', label: 'CNC Machine' },
  { value: 'Welding', label: 'Welding Equipment' },
  { value: 'Drilling', label: 'Drilling Equipment' },
  { value: 'Grinding', label: 'Grinding Equipment' },
  { value: 'Cutting', label: 'Cutting Equipment' },
  { value: '3D_Printer', label: '3D Printer' },
  { value: 'Laser', label: 'Laser Equipment' },
  { value: 'Plasma', label: 'Plasma Equipment' },
  { value: 'Press', label: 'Press Equipment' },
  { value: 'Assembly', label: 'Assembly Station' },
  { value: 'Quality', label: 'Quality Control' },
  { value: 'Other', label: 'Other Equipment' },
] as const;

export const OPERATOR_STATUS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'TRAINING', label: 'In Training' },
] as const;

export const OPERATOR_SHIFTS = [
  { value: 'DAY', label: 'Day Shift (8AM - 4PM)' },
  { value: 'EVENING', label: 'Evening Shift (4PM - 12AM)' },
  { value: 'NIGHT', label: 'Night Shift (12AM - 8AM)' },
  { value: 'FLEXIBLE', label: 'Flexible Hours' },
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

export const TASK_PRIORITY = [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'URGENT', label: 'Urgent' },
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

// Helper functions to get labels by value
export const getSkillLabel = (value: string) => AVAILABLE_SKILLS.find((skill) => skill.value === value)?.label || value;

export const getMachineTypeLabel = (value: string) =>
  MACHINE_TYPES.find((type) => type.value === value)?.label || value;

export const getOperatorStatusLabel = (value: string) =>
  OPERATOR_STATUS.find((status) => status.value === value)?.label || value;

export const getOperatorShiftLabel = (value: string) =>
  OPERATOR_SHIFTS.find((shift) => shift.value === value)?.label || value;

export const getMachineStatusLabel = (value: string) =>
  MACHINE_STATUS.find((status) => status.value === value)?.label || value;

export const getTaskStatusLabel = (value: string) =>
  TASK_STATUS.find((status) => status.value === value)?.label || value;

export const getTaskPriorityLabel = (value: string) =>
  TASK_PRIORITY.find((priority) => priority.value === value)?.label || value;

export const getProjectStatusLabel = (value: string) =>
  PROJECT_STATUS.find((status) => status.value === value)?.label || value;

export const getItemStatusLabel = (value: string) =>
  ITEM_STATUS.find((status) => status.value === value)?.label || value;
