import { logger } from './logger';
import toast from 'react-hot-toast';
/**
 * Reusable utility for handling task conflict errors on the frontend
 */
export interface ConflictError {
  error: string;
  conflict?: {
    id: string;
    title: string;
    timeSlot: {
      id: string;
      startDateTime: Date | string;
      endDateTime: Date | string | null;
      durationMin: number;
    };
    machine?: { id: string; name: string } | null;
    operator?: { id: string; name: string } | null;
  };
}

/**
 * Display a user-friendly conflict error message
 */
export function displayConflictError(errorData: ConflictError): void {
  if (errorData.conflict) {
    const conflictType = errorData.conflict.machine ? 'Machine' : 'Operator';
    const conflictName = errorData.conflict.machine?.name || errorData.conflict.operator?.name || 'Unknown';
    
    // Get time slot information
    const timeSlot = errorData.conflict.timeSlot;
    const conflictStartDate = new Date(timeSlot.startDateTime);
    const conflictEndDate = timeSlot.endDateTime 
      ? new Date(timeSlot.endDateTime)
      : new Date(conflictStartDate.getTime() + timeSlot.durationMin * 60 * 1000);

    // Format dates using native browser date formatting
    const conflictStart = conflictStartDate.toLocaleString();
    const conflictEnd = conflictEndDate.toLocaleString();

    toast.error(
      `Scheduling conflict: ${conflictType} "${conflictName}" is already booked for task "${errorData.conflict.title}" from ${conflictStart} to ${conflictEnd}`,
      { duration: 7000 }
    );
  } else {
    toast.error('Failed to save task: ' + (errorData.error || 'Unknown error'));
  }
}

/**
 * Handle API response for task operations with conflict detection
 */
export async function handleTaskResponse(
  response: Response,
  onSuccess: () => void,
  operationName: string = 'save task',
): Promise<void> {
  if (response.ok) {
    onSuccess();
  } else {
    const errorData = await response.json();

    // Use appropriate log level based on error type
    if (errorData.conflict) {
      console.warn(`Scheduling conflict during ${operationName}:`, errorData.error);
    } else {
      logger.error(`Failed to ${operationName},`, errorData.error);
    }

    displayConflictError(errorData);
  }
}
