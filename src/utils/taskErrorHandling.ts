import { formatDateTimeForDisplay } from '@/utils/timezone';

/**
 * Reusable utility for handling task conflict errors on the frontend
 */
export interface ConflictError {
  error: string;
  conflict?: {
    id: string;
    title: string;
    scheduledAt: string;
    durationMin: number;
    machine?: { id: string; name: string };
    operator?: { id: string; name: string };
  };
}

/**
 * Display a user-friendly conflict error message
 */
export function displayConflictError(errorData: ConflictError): void {
  if (errorData.conflict) {
    const conflictType = errorData.conflict.machine ? 'Machine' : 'Operator';
    const conflictName = errorData.conflict.machine?.name || errorData.conflict.operator?.name || 'Unknown';
    const conflictStartDate = new Date(errorData.conflict.scheduledAt);
    const conflictEndDate = new Date(
      new Date(errorData.conflict.scheduledAt).getTime() + (errorData.conflict.durationMin || 60) * 60 * 1000,
    );

    // Format dates using timezone utilities for consistent display
    const { date: startDate, time: startTime } = formatDateTimeForDisplay(conflictStartDate);
    const { date: endDate, time: endTime } = formatDateTimeForDisplay(conflictEndDate);
    const conflictStart = `${startDate} ${startTime}`;
    const conflictEnd = `${endDate} ${endTime}`;

    alert(
      `Scheduling conflict detected:\n\n${conflictType} "${conflictName}" is already booked for task "${errorData.conflict.title}" from ${conflictStart} to ${conflictEnd}`,
    );
  } else {
    alert('Failed to save task: ' + (errorData.error || 'Unknown error'));
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
      console.error(`Failed to ${operationName}:`, errorData.error);
    }

    displayConflictError(errorData);
  }
}
