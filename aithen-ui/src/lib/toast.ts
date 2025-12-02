/**
 * Centralized Toast Notification Utility
 * 
 * Provides a consistent API for showing toast notifications throughout the app.
 * Uses Sonner for modern, customizable toast notifications.
 * 
 * Usage:
 * ```ts
 * import { toast } from '@/lib/toast';
 * 
 * toast.success('Operation completed successfully');
 * toast.error('Something went wrong');
 * toast.loading('Processing...');
 * ```
 */

import { toast as sonnerToast } from 'sonner';

type ToastOptions = {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
};

/**
 * Show a success toast notification
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },

  /**
   * Show a loading toast notification
   * Returns a toast ID that can be used to update or dismiss the toast
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: Infinity, // Loading toasts don't auto-dismiss
    });
  },

  /**
   * Show a promise toast notification
   * Automatically shows loading, success, or error states
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...options,
    });
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    sonnerToast.dismissAll();
  },
};

