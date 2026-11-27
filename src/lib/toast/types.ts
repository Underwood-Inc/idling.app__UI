import type { ToastViewportPlacement } from './placement';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

/** `auto` removes after `durationMs`; `manual` requires an explicit dismiss action. */
export type ToastDismissMode = 'auto' | 'manual';

export interface ToastRecord {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  dismissMode: ToastDismissMode;
  durationMs: number;
  createdAt: number;
  /** Replacing an existing visible toast instead of stacking another. */
  dedupeKey?: string;
  ariaLive: 'polite' | 'assertive';
  placement: ToastViewportPlacement;
}

export type ToastEnqueueInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  dismissMode?: ToastDismissMode;
  durationMs?: number;
  dedupeKey?: string;
  id?: string;
};

export const DEFAULT_TOAST_DURATION_MS = 5_000;
export const MAX_VISIBLE_TOASTS = 5;