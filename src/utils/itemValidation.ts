// Utility functions for item validation and completion readiness

export interface Task {
  id: string;
  title: string;
  status: string;
}

export interface ItemCompletionStatus {
  canComplete: boolean;
  incompleteTasks: Task[];
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}

/**
 * Check if an item can be marked as completed based on its tasks
 */
export function checkItemCompletionReadiness(tasks: Task[]): ItemCompletionStatus {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED');
  const incompleteTasks = tasks.filter((task) => task.status !== 'COMPLETED');

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return {
    canComplete: incompleteTasks.length === 0 && totalTasks > 0,
    incompleteTasks,
    totalTasks,
    completedTasks: completedTasks.length,
    completionPercentage,
  };
}

/**
 * Get a user-friendly message about item completion status
 */
export function getItemCompletionMessage(status: ItemCompletionStatus): string {
  if (status.totalTasks === 0) {
    return 'This item has no tasks. Add tasks before marking as completed.';
  }

  if (status.canComplete) {
    return 'All tasks are completed. This item is ready to be marked as completed.';
  }

  const remainingCount = status.incompleteTasks.length;
  const taskWord = remainingCount === 1 ? 'task' : 'tasks';

  return `${remainingCount} ${taskWord} must be completed before this item can be marked as completed.`;
}

/**
 * Get the color variant for status indication
 */
export function getItemCompletionVariant(status: ItemCompletionStatus): 'success' | 'warning' | 'error' {
  if (status.totalTasks === 0) {
    return 'warning';
  }

  if (status.canComplete) {
    return 'success';
  }

  return 'error';
}
