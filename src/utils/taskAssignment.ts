import { logger } from './logger';
import toast from 'react-hot-toast';
import { displayConflictError } from './taskErrorHandling';
// Shared utility for handling task assignment updates
export interface TimeSlot {
  id?: string;
  startDateTime: string;
  endDateTime?: string;
  durationMin: number;
}

export interface TaskAssignmentUpdate {
  itemId: string | null;
  machineIds: string[];
  operatorIds: string[];
  timeSlots: TimeSlot[];
  quantity: number;
  completed_quantity: number;
  status: string;
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
  // Support both old and new formats for backward compatibility
  machine?: { id: string; name: string } | null;
  operator?: { id: string; name: string } | null;
  machines?: { id: string; name: string }[];
  operators?: { id: string; name: string }[];
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
        status: update.status,
        itemId: update.itemId,
        machineIds: update.machineIds,
        operatorIds: update.operatorIds,
        quantity: update.quantity,
        completed_quantity: update.completed_quantity,
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
      toast.success('Task updated successfully');
    } else {
      // Use the conflict error handler for detailed error messages
      if (data.conflict) {
        displayConflictError(data);
      } else {
        const errorMessage =
          typeof data.error === 'object' && data.error?.message
            ? data.error.message
            : data.error || 'Failed to update assignment';
        toast.error(errorMessage);
      }
    }
  } catch (error) {
    logger.error('Error updating task assignment,', error);
    toast.error('Error updating task. Please try again.');
  }
};
