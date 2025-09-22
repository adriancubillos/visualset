// Utility functions for project validation and completion readiness

export interface Item {
  id: string;
  name: string;
  status: string;
}

export interface ProjectCompletionStatus {
  canComplete: boolean;
  incompleteItems: Item[];
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
}

/**
 * Check if a project can be marked as completed based on its items
 */
export function checkProjectCompletionReadiness(items: Item[]): ProjectCompletionStatus {
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.status === 'COMPLETED');
  const incompleteItems = items.filter((item) => item.status !== 'COMPLETED');

  const completionPercentage = totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 0;

  return {
    canComplete: incompleteItems.length === 0 && totalItems > 0,
    incompleteItems,
    totalItems,
    completedItems: completedItems.length,
    completionPercentage,
  };
}

/**
 * Get a user-friendly message about project completion status
 */
export function getProjectCompletionMessage(status: ProjectCompletionStatus): string {
  if (status.totalItems === 0) {
    return 'This project has no items. Add items before marking as completed.';
  }

  if (status.canComplete) {
    return 'All items are completed. This project is ready to be marked as completed.';
  }

  const remainingCount = status.incompleteItems.length;
  const itemWord = remainingCount === 1 ? 'item' : 'items';

  return `${remainingCount} ${itemWord} must be completed before this project can be marked as completed.`;
}

/**
 * Get the color variant for status indication
 */
export function getProjectCompletionVariant(status: ProjectCompletionStatus): 'success' | 'warning' | 'error' {
  if (status.totalItems === 0) {
    return 'warning';
  }

  if (status.canComplete) {
    return 'success';
  }

  return 'error';
}
