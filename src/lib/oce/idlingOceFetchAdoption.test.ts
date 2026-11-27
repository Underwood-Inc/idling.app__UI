import { describe, expect, test, vi } from 'vitest';
import { createConnectivityEngine } from './connectivity';
import {
  createIdlingOceInstrumentedFetch,
  IDLING_SW_CACHE_SERVED_HEADER,
  wireIdlingOceFetch,
} from './idlingOceFetchAdoption';

const HEALTH = '/health';

describe('idling OCE fetch adoption', () => {
  test('SW cache-served response is ignored by OCE; caller still gets body', async () => {
    const baseFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url.includes('cached')) {
        return new Response('cached', {
          status: 200,
          headers: { [IDLING_SW_CACHE_SERVED_HEADER]: '1' },
        });
      }
      return new Response('live', { status: 200 });
    });

    const instrumented = createIdlingOceInstrumentedFetch(
      baseFetch as typeof fetch
    );
    const engine = createConnectivityEngine({
      healthCheckUrl: HEALTH,
      baseFetch: instrumented,
    });
    const idlingFetch = wireIdlingOceFetch(engine, baseFetch as typeof fetch);

    await idlingFetch('/api/live');
    expect(engine.getSnapshot().streak).toBe(0);
    expect(engine.getSnapshot().unavailable).toBe(false);

    const response = await idlingFetch('/api/cached');
    expect(await response.text()).toBe('cached');
    expect(engine.getSnapshot().streak).toBe(0);
    expect(engine.getSnapshot().unavailable).toBe(false);
  });
});