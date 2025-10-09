import { showConfirmDialog } from '@/components/ui/ConfirmDialog';
import { extractErrorMessage } from '@/utils/errorHandling';
import { logger } from '@/utils/logger';

type Method = 'PATCH' | 'PUT';

type SendResult = {
  ok: boolean;
  response?: Response;
  data?: unknown;
  error?: unknown;
};

async function sendTaskUpdate(taskId: string, payload: unknown, method: Method = 'PATCH'): Promise<SendResult> {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let data: unknown = undefined;
    try {
      // attempt to parse json, ignore if body is empty or invalid
      data = await response.json();
    } catch {
      // ignore parse errors
    }

    if (!response.ok) {
      const error = await extractErrorMessage(response, 'Failed to update task');
      return { ok: false, response, data, error };
    }

    return { ok: true, response, data };
  } catch (err) {
    logger.error('Error updating task', err);
    return { ok: false, error: err };
  }
}

function needsUncompleteConfirm(existingStatus?: string | null, newStatus?: string | null) {
  return existingStatus === 'COMPLETED' && newStatus !== 'COMPLETED';
}

export async function updateTaskWithConfirm(
  taskId: string,
  payload: unknown,
  opts?: { existingStatus?: string | null; newStatus?: string | null; method?: Method },
): Promise<SendResult> {
  const { existingStatus, newStatus, method = 'PATCH' } = opts || {};

  if (needsUncompleteConfirm(existingStatus, newStatus)) {
    return await new Promise<SendResult>((resolve) => {
      showConfirmDialog({
        title: 'Reset progress?',
        message:
          'This task is currently COMPLETED. Changing the status away from COMPLETED will reset its completed progress to 0. Do you want to continue?',
        confirmLabel: 'Yes, reset progress',
        cancelLabel: 'Cancel',
        variant: 'warning',
        onConfirm: async () => {
          const result = await sendTaskUpdate(taskId, payload, method);
          resolve(result);
        },
      });
    });
  }

  return sendTaskUpdate(taskId, payload, method);
}

export { sendTaskUpdate };
