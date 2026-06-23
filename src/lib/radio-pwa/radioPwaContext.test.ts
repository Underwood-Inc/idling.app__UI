import { describe, expect, test } from 'vitest';
import { syncRadioPwaDomContext } from './radioPwaClientContext';

describe('syncRadioPwaDomContext', () => {
  test('tags html in standalone display mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('standalone'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });

    syncRadioPwaDomContext();

    expect(document.documentElement.dataset.radioPwa).toBe('standalone');
  });

  test('clears html tag in regular browser mode', () => {
    document.documentElement.dataset.radioPwa = 'standalone';

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: false,
        media: '',
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });

    syncRadioPwaDomContext();

    expect(document.documentElement.dataset.radioPwa).toBeUndefined();
  });
});
