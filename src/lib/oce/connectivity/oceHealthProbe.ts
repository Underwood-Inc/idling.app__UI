/** Same-origin probe for OCE confirm step (public, unauthenticated). */
export const IDLING_OCE_HEALTH_CHECK_URL = '/api/version';

/** Request header: SW must not satisfy OCE probes from stale cache (see `public/sw.js`). */
export const OCE_CONNECTIVITY_PROBE_HEADER = 'x-idling-connectivity-probe';

export const OCE_CONNECTIVITY_PROBE_VALUE = '1';

export function oceConnectivityProbeHeaders(): Record<string, string> {
  return {
    [OCE_CONNECTIVITY_PROBE_HEADER]: OCE_CONNECTIVITY_PROBE_VALUE,
  };
}

/** True only when the browser reports online and the health response is OK. */
export function interpretOceHealthResponse(response: Response): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  return response.ok;
}