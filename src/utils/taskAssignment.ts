import { logger } from './logger';
import toast from 'react-hot-toast';
import { displayConflictError } from './taskErrorHandling';
import { updateTaskWithConfirm } from './taskApi';
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
  status?: string;
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
    const payload = {
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
    };

    const result = await updateTaskWithConfirm(selectedTask.id, payload, {
      existingStatus: selectedTask.status,
      newStatus: update.status,
      // Use PATCH for partial/assignment updates so other fields aren't unintentionally cleared
      method: 'PATCH',
    });

    if (result.ok && result.data) {
      // Ensure completed_quantity is present when server omits it after marking COMPLETED
      const resp = result.data as Record<string, unknown>;
      const updatedTask = { ...(resp as unknown as Record<string, unknown>) } as Task & Record<string, unknown>;
      if (updatedTask.status === 'COMPLETED' && updatedTask.completed_quantity === undefined) {
        // Safely resolve quantity from response or from the original selectedTask if available
        const respQty = (updatedTask.quantity as number | undefined) ?? undefined;
        const originalQty =
          (selectedTask as unknown) && (selectedTask as unknown as Record<string, unknown>)['quantity'];
        const qty = (
          typeof respQty === 'number' ? respQty : typeof originalQty === 'number' ? originalQty : 0
        ) as number;
        // Assign completed_quantity with a narrow typed object
        (updatedTask as Task & { completed_quantity?: number }).completed_quantity = qty;
      }

      onSuccess(updatedTask as Task);
      onClose();
      toast.success('Task updated successfully');
    } else {
      const serverData = result.data as Record<string, unknown> | undefined;
      if (serverData && (serverData as unknown as { conflict?: boolean }).conflict) {
        displayConflictError(serverData);
      } else {
        const err =
          result.error ??
          (serverData && (serverData as unknown as { error?: unknown }).error) ??
          'Failed to update assignment';
        let errorMessage = 'Failed to update assignment';
        if (typeof err === 'string') errorMessage = err;
        else if (typeof err === 'object' && err && 'message' in (err as Record<string, unknown>)) {
          const maybe = err as Record<string, unknown>;
          if (typeof maybe.message === 'string') errorMessage = maybe.message;
        }
        toast.error(errorMessage);
      }
    }
  } catch (error) {
    logger.error('Error updating task assignment,', error);
    toast.error('Error updating task. Please try again.');
  }
};
