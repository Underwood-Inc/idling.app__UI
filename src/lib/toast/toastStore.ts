import { resolveToastPlacement } from './placement';
import {
  DEFAULT_TOAST_DURATION_MS,
  MAX_VISIBLE_TOASTS,
  type ToastEnqueueInput,
  type ToastRecord,
  type ToastVariant,
} from './types';

type Listener = () => void;

let toastSeq = 0;

function nextToastId(): string {
  toastSeq += 1;
  return `toast-${toastSeq}`;
}

function ariaLiveForVariant(variant: ToastVariant): 'polite' | 'assertive' {
  return variant === 'error' || variant === 'warning' ? 'assertive' : 'polite';
}

const listeners = new Set<Listener>();
const autoDismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

let toasts: ToastRecord[] = [];

function emit(): void {
  listeners.forEach((listener) => listener());
}

function clearAutoDismissTimer(id: string): void {
  const timer = autoDismissTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    autoDismissTimers.delete(id);
  }
}

function scheduleAutoDismiss(record: ToastRecord): void {
  if (record.dismissMode !== 'auto') {
    return;
  }

  clearAutoDismissTimer(record.id);
  const timer = setTimeout(() => {
    dismissToast(record.id);
  }, record.durationMs);
  autoDismissTimers.set(record.id, timer);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastSnapshot(): readonly ToastRecord[] {
  return toasts;
}

export function enqueueToast(input: ToastEnqueueInput): string {
  const variant = input.variant ?? 'info';
  const dismissMode = input.dismissMode ?? 'auto';
  const durationMs = input.durationMs ?? DEFAULT_TOAST_DURATION_MS;
  const id = input.id ?? nextToastId();

  const record: ToastRecord = {
    id,
    title: input.title,
    description: input.description,
    variant,
    dismissMode,
    durationMs,
    createdAt: Date.now(),
    dedupeKey: input.dedupeKey,
    ariaLive: ariaLiveForVariant(variant),
    placement: resolveToastPlacement(variant),
  };

  if (input.dedupeKey) {
    const existingIndex = toasts.findIndex((t) => t.dedupeKey === input.dedupeKey);
    if (existingIndex >= 0) {
      const previous = toasts[existingIndex]!;
      clearAutoDismissTimer(previous.id);
      toasts = [...toasts];
      toasts[existingIndex] = { ...record, id: previous.id };
      scheduleAutoDismiss(toasts[existingIndex]!);
      emit();
      return previous.id;
    }
  }

  toasts = [record, ...toasts].slice(0, MAX_VISIBLE_TOASTS);
  scheduleAutoDismiss(record);
  emit();
  return id;
}

export function dismissToast(id: string): void {
  const exists = toasts.some((t) => t.id === id);
  if (!exists) {
    return;
  }
  clearAutoDismissTimer(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function dismissToastByDedupeKey(dedupeKey: string): void {
  const match = toasts.find((t) => t.dedupeKey === dedupeKey);
  if (match) {
    dismissToast(match.id);
  }
}

export function dismissAllToasts(): void {
  toasts.forEach((t) => clearAutoDismissTimer(t.id));
  toasts = [];
  emit();
}

export function pauseToastAutoDismiss(id: string): void {
  clearAutoDismissTimer(id);
}

export function resumeToastAutoDismiss(id: string): void {
  const record = toasts.find((t) => t.id === id);
  if (!record || record.dismissMode !== 'auto') {
    return;
  }
  scheduleAutoDismiss(record);
}

/** Vitest-only */
export function resetToastStoreForTests(): void {
  dismissAllToasts();
  toastSeq = 0;
}