// Shared utility for handling task assignment updates
export interface TaskAssignmentUpdate {
  projectId: string | null;
  machineId: string | null;
  operatorId: string | null;
  scheduledAt?: string;
  durationMin?: number;
}

export interface Task {
  id: string;
  scheduledAt: string;
  durationMin: number;
  [key: string]: any;
}

export const handleTaskAssignmentUpdate = async (
  selectedTask: Task | null,
  update: TaskAssignmentUpdate,
  onSuccess: (updatedTask: any) => void,
  onClose: () => void
): Promise<void> => {
  if (!selectedTask) return;

  try {
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: selectedTask.id,
        scheduledAt: update.scheduledAt || selectedTask.scheduledAt,
        durationMin: update.durationMin || selectedTask.durationMin,
        projectId: update.projectId,
        machineId: update.machineId,
        operatorId: update.operatorId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      onSuccess(data);
      onClose();
    } else {
      alert(data.error || 'Failed to update assignment');
    }
  } catch (error) {
    console.error('Error updating task assignment:', error);
    alert('Error updating task assignment. Please try again.');
  }
};
