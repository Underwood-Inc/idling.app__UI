import { enqueueToast, dismissToast, dismissToastByDedupeKey, dismissAllToasts } from './toastStore';
import type { ToastEnqueueInput } from './types';

function show(input: ToastEnqueueInput): string {
  return enqueueToast(input);
}

export const toast = Object.assign(show, {
  show,
  info: (title: string, options?: Omit<ToastEnqueueInput, 'title' | 'variant'>) =>
    enqueueToast({ ...options, title, variant: 'info' }),
  success: (title: string, options?: Omit<ToastEnqueueInput, 'title' | 'variant'>) =>
    enqueueToast({ ...options, title, variant: 'success' }),
  warning: (title: string, options?: Omit<ToastEnqueueInput, 'title' | 'variant'>) =>
    enqueueToast({ ...options, title, variant: 'warning' }),
  error: (title: string, options?: Omit<ToastEnqueueInput, 'title' | 'variant'>) =>
    enqueueToast({ ...options, title, variant: 'error' }),
  dismiss: dismissToast,
  dismissByKey: dismissToastByDedupeKey,
  dismissAll: dismissAllToasts,
});