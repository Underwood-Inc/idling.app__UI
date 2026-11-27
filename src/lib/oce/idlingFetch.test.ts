import { afterEach, describe, expect, test, vi } from 'vitest';
import { resetPageConnectivityEngineForTests } from './connectivity';

afterEach(() => {
  resetPageConnectivityEngineForTests();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('idlingFetch', () => {
  /**
   * @linked FR-OCE-007
   */
  test('[FR-OCE-007] getIdlingOceEngine returns the page singleton engine', async () => {
    const { getIdlingOceEngine } = await import('./idlingFetch');
    const first = getIdlingOceEngine();
    const second = getIdlingOceEngine();
    expect(second).toBe(first);
  });

  test('idlingFetch delegates to global fetch', async () => {
    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { idlingFetch } = await import('./idlingFetch');
    const response = await idlingFetch('/api/radio/favorites/stations');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/radio/favorites/stations',
      undefined
    );
    expect(response.status).toBe(200);
  });
});