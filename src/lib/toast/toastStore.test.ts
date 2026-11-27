import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  dismissToast,
  enqueueToast,
  getToastSnapshot,
  resetToastStoreForTests,
} from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetToastStoreForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('stacks toasts up to the visible limit', () => {
    for (let i = 0; i < 7; i += 1) {
      enqueueToast({ title: `Toast ${i}` });
    }
    expect(getToastSnapshot()).toHaveLength(5);
    expect(getToastSnapshot()[0]?.title).toBe('Toast 6');
  });

  test('auto dismiss removes toast after duration', () => {
    const id = enqueueToast({ title: 'Ephemeral', durationMs: 3_000, dismissMode: 'auto' });
    expect(getToastSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(3_000);
    expect(getToastSnapshot()).toHaveLength(0);
    dismissToast(id);
    expect(getToastSnapshot()).toHaveLength(0);
  });

  test('manual dismiss mode does not auto-remove', () => {
    enqueueToast({ title: 'Sticky', dismissMode: 'manual' });
    vi.advanceTimersByTime(60_000);
    expect(getToastSnapshot()).toHaveLength(1);
  });

  test('dedupeKey replaces an existing toast instead of stacking', () => {
    enqueueToast({ title: 'First', dedupeKey: 'net' });
    enqueueToast({ title: 'Second', dedupeKey: 'net' });
    expect(getToastSnapshot()).toHaveLength(1);
    expect(getToastSnapshot()[0]?.title).toBe('Second');
  });
});