/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Essential DOM Observer API Mocks
 *
 * Only the minimal observer APIs that were originally mocked and needed
 */
import { vi } from 'vitest';

/**
 * Mock observer APIs that are commonly used but not available in jsdom
 */
export const mockObserverAPIs = (): void => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
    constructor(_callback: IntersectionObserverCallback) {}
  }

  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;

  class MockResizeObserver implements ResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    constructor(_callback: ResizeObserverCallback) {}
  }

  global.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
};

/**
 * Apply essential DOM mocks
 */
export const mockDOMAPIs = (): void => {
  mockObserverAPIs();
};
