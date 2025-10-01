// Shared utility for handling task assignment updates
export interface TimeSlot {
  id?: string;
  startDateTime: string;
  endDateTime?: string;
  durationMin: number;
}

export interface TaskAssignmentUpdate {
  itemId: string | null;
  machineId: string | null;
  operatorId: string | null;
  timeSlots: TimeSlot[];
}

export interface Task {
  id: string;
  title: string;
  timeSlots?: {
    id: string;
    startDateTime: string;
    endDateTime?: string | null;
    durationMin: number;
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

  try {
    // Use the tasks API endpoint which properly handles timeSlots
    const response = await fetch(`/api/tasks/${selectedTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: selectedTask.title, // Required field
        itemId: update.itemId,
        machineId: update.machineId,
        operatorId: update.operatorId,
        timeSlots: update.timeSlots.map((slot) => ({
          startDateTime: new Date(slot.startDateTime).toISOString(),
          endDateTime: slot.endDateTime ? new Date(slot.endDateTime).toISOString() : undefined,
          durationMin: slot.durationMin,
        })),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      onSuccess(data);
      onClose();
    } else {
      alert(data.error || 'Failed to update assignment');
    }
  } catch (error) {
    console.error('Error updating task assignment:', error);
    alert('Error updating task. Please try again.');
  }
};
