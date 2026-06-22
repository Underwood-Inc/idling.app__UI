/**
 * Essential Browser Window API Mocks
 *
 * Only the minimal mocks that are actually needed and were working before
 */
import { vi } from 'vitest';

/**
 * Mock window.matchMedia API
 *
 * The matchMedia API is not available in the jsdom test environment, but many
 * components (especially responsive ones) rely on it. This mock provides a
 * basic implementation that returns consistent values for testing.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
 */
export const mockMatchMedia = (): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
};

/**
 * Apply essential window mocks
 */
export const mockWindowAPIs = (): void => {
  mockMatchMedia();
};
