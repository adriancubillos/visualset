/**
 * Toast notification utilities
 * Centralized toast notifications using react-hot-toast
 */

import React from 'react';
import toast from 'react-hot-toast';

/**
 * Show success toast
 */
export const showSuccess = (message: string) => {
  toast.success(message);
};

/**
 * Show error toast
 */
export const showError = (message: string) => {
  toast.error(message);
};

/**
 * Show info toast
 */
export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

/**
 * Show warning toast
 */
export const showWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  });
};

/**
 * Show loading toast (returns toast id for dismissal)
 */
export const showLoading = (message: string) => {
  return toast.loading(message);
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Show promise toast (automatically handles loading, success, error states)
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  },
) => {
  return toast.promise(promise, messages);
};

/**
 * Confirm action with toast (replacement for window.confirm)
 */
export const confirmAction = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const toastId = toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium">{message}</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors">
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          maxWidth: '500px',
        },
      },
    );
  });
};
