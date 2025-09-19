// Shared utility for handling task assignment updates
export interface TaskAssignmentUpdate {
  itemId: string | null;
  machineId: string | null;
  operatorId: string | null;
  scheduledAt?: string;
  durationMin?: number;
}

export interface Task {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  project: { id: string; name: string; color?: string | null } | null;
  item: { id: string; name: string } | null;
  machine: { id: string; name: string } | null;
  operator: { id: string; name: string } | null;
}

export const handleTaskAssignmentUpdate = async (
  selectedTask: Task | null,
  update: TaskAssignmentUpdate,
  onSuccess: (updatedTask: Task) => void,
  onClose: () => void,
): Promise<void> => {
  if (!selectedTask) return;

  try {
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: selectedTask.id,
        itemId: update.itemId,
        machineId: update.machineId,
        operatorId: update.operatorId,
        scheduledAt: update.scheduledAt,
        durationMin: update.durationMin,
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
