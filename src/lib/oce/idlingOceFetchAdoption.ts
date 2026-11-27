import type { ConnectivityEngine } from './connectivity';

/** Must match `IDLING_SW_CACHE_SERVED_HEADER` in `public/sw.js`. */
export const IDLING_SW_CACHE_SERVED_HEADER = 'x-idling-sw-cache-served';

export const IDLING_CACHED_RESPONSE = Symbol.for('idling.oce.cachedResponse');

export type IdlingCacheIgnoredError = DOMException & {
  [IDLING_CACHED_RESPONSE]: Response;
};

export function isIdlingSwCacheServedResponse(response: Response): boolean {
  return response.headers.get(IDLING_SW_CACHE_SERVED_HEADER) === '1';
}

/**
 * Downstream adoption: SW cache hits become AbortError so OCE settles as `ignored`
 * (see connectivity `classifyFetchOutcome`). Callers still receive the Response.
 */
export function createIdlingOceInstrumentedFetch(
  innerFetch: typeof fetch
): typeof fetch {
  return async (input, init) => {
    const response = await innerFetch(input, init);
    if (isIdlingSwCacheServedResponse(response)) {
      const error = new DOMException(
        'OCE ignores SW cache response',
        'AbortError'
      ) as IdlingCacheIgnoredError;
      error[IDLING_CACHED_RESPONSE] = response;
      throw error;
    }
    return response;
  };
}

export function restoreIdlingCacheResponse(
  trackedFetch: typeof fetch
): typeof fetch {
  return async (input, init) => {
    try {
      return await trackedFetch(input, init);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        IDLING_CACHED_RESPONSE in error
      ) {
        const cached = (error as IdlingCacheIgnoredError)[IDLING_CACHED_RESPONSE];
        if (cached instanceof Response) {
          return cached;
        }
      }
      throw error;
    }
  };
}

export function wireIdlingOceFetch(
  engine: ConnectivityEngine,
  globalFetch: typeof fetch = globalThis.fetch
): typeof fetch {
  const instrumented = createIdlingOceInstrumentedFetch(globalFetch);
  const tracked = engine.attachFetch(instrumented);
  return restoreIdlingCacheResponse(tracked);
}