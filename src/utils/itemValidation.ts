// Utility functions for item validation and completion readiness

export interface Task {
  id: string;
  title: string;
  status: string;
  quantity?: number;
  completed_quantity?: number;
}

export interface ItemCompletionStatus {
  canComplete: boolean;
  incompleteTasks: Task[];
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  quantityProgress?: {
    totalRequired: number;
    totalCompleted: number;
    percentage: number;
  };
}

/**
 * Check if an item can be marked as completed based on its tasks
 */
export function checkItemCompletionReadiness(tasks: Task[]): ItemCompletionStatus {
  const totalTasks = tasks.length;

  // For tasks with quantity tracking, check if completed_quantity >= quantity
  // For legacy tasks without quantity, fall back to status-based completion
  const completedTasks = tasks.filter((task) => {
    if (typeof task.quantity === 'number' && typeof task.completed_quantity === 'number') {
      return task.completed_quantity >= task.quantity;
    }
    return task.status === 'COMPLETED';
  });

  const incompleteTasks = tasks.filter((task) => {
    if (typeof task.quantity === 'number' && typeof task.completed_quantity === 'number') {
      return task.completed_quantity < task.quantity;
    }
    return task.status !== 'COMPLETED';
  });

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Calculate quantity-based progress if tasks have quantity tracking
  let quantityProgress;
  const hasQuantityTracking = tasks.some(
    (task) => typeof task.quantity === 'number' && typeof task.completed_quantity === 'number',
  );

  if (hasQuantityTracking) {
    const totalRequired = tasks.reduce((sum, task) => sum + (task.quantity || 1), 0);
    const totalCompleted = tasks.reduce((sum, task) => sum + (task.completed_quantity || 0), 0);
    const percentage = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

    quantityProgress = {
      totalRequired,
      totalCompleted,
      percentage,
    };
  }

  return {
    canComplete: incompleteTasks.length === 0 && totalTasks > 0,
    incompleteTasks,
    totalTasks,
    completedTasks: completedTasks.length,
    completionPercentage,
    quantityProgress,
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

  // If we have quantity progress, show more detailed information
  if (status.quantityProgress) {
    const { totalCompleted, totalRequired, percentage } = status.quantityProgress;
    return `${remainingCount} ${taskWord} must be completed before this item can be marked as completed. Progress: ${totalCompleted}/${totalRequired} (${percentage}%)`;
  }

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
