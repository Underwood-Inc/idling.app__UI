import { afterEach, describe, expect, test, vi } from 'vitest';
import { OCE, OfflineConnectivityEngine } from './OCE';

afterEach(() => {
  OCE.resetForTests();
  vi.unstubAllGlobals();
});

describe('OCE', () => {
  test('OfflineConnectivityEngine is the same singleton as OCE', () => {
    expect(OfflineConnectivityEngine).toBe(OCE);
    expect(OfflineConnectivityEngine.fetch).toBe(OCE.fetch);
  });

  test('[FR-OCE-007] fetch uses one engine for the process', async () => {
    expect(OCE.engine).toBe(OCE.engine);
  });

  test('fetch calls native fetch', async () => {
    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    OCE.resetForTests();
    const response = await OCE.fetch('/api/radio/favorites/stations');

    expect(fetchMock).toHaveBeenCalledWith('/api/radio/favorites/stations', undefined);
    expect(response.status).toBe(200);
  });

  test('SW cache header settles ignored but returns body to caller', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url.includes('cached')) {
        return new Response('cached', {
          status: 200,
          headers: { 'x-idling-sw-cache-served': '1' },
        });
      }
      return new Response('live', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    OCE.resetForTests();
    await OCE.fetch('/api/live');
    const response = await OCE.fetch('/api/cached');
    expect(await response.text()).toBe('cached');
    expect(OCE.engine.getSnapshot().unavailable).toBe(false);
  });
});