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
  timeSlots?: { 
    id: string; 
    startDateTime: string; 
    endDateTime?: string | null; 
    durationMin: number; 
    isPrimary: boolean; 
  }[];
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

  // Get primary time slot or first time slot for current scheduling info
  const primarySlot = selectedTask.timeSlots?.find(slot => slot.isPrimary) || selectedTask.timeSlots?.[0];
  
  try {
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: selectedTask.id,
        itemId: update.itemId,
        machineId: update.machineId,
        operatorId: update.operatorId,
        scheduledAt: update.scheduledAt || primarySlot?.startDateTime,
        durationMin: update.durationMin || primarySlot?.durationMin || 60,
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
