/**
 * NO-CACHE FETCH UTILITY
 *
 * Ensures ALL requests are never cached anywhere - browser, proxy, CDN, etc.
 * Use this for ALL admin-related API calls to prevent permission bypass via caching.
 */

export interface NoCacheFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData | URLSearchParams;
  credentials?: 'include' | 'omit' | 'same-origin';
  cache?:
    | 'no-store'
    | 'no-cache'
    | 'force-cache'
    | 'only-if-cached'
    | 'reload'
    | 'default';
}

/**
 * Aggressive no-cache headers that prevent caching at every level
 */
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, private',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
  'X-Accel-Expires': '0',
  'X-Proxy-Cache': 'BYPASS',
  'X-Cache': 'MISS',
  Vary: '*'
} as const;

/**
 * Fetch wrapper that NEVER caches responses
 *
 * Adds aggressive no-cache headers and timestamp to URL to ensure
 * every request is fresh and never served from any cache.
 */
export async function noCacheFetch(
  url: string,
  options: NoCacheFetchOptions = {}
): Promise<Response> {
  // Add timestamp to URL to ensure unique requests
  const separator = url.includes('?') ? '&' : '?';
  const timestampedUrl = `${url}${separator}_t=${Date.now()}&_r=${Math.random()}`;

  // Merge no-cache headers with any existing headers
  const headers = {
    ...NO_CACHE_HEADERS,
    ...options.headers
  };

  // Always include credentials for admin requests
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' as const,
    cache: 'no-store' as const // Additional browser-level cache prevention
  };

  return fetch(timestampedUrl, fetchOptions);
}

/**
 * Helper for admin API calls with permission validation
 */
export async function adminFetch(
  endpoint: string,
  options: NoCacheFetchOptions = {}
): Promise<Response> {
  // Ensure admin endpoints start with /api/admin
  const adminEndpoint = endpoint.startsWith('/api/admin')
    ? endpoint
    : `/api/admin${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await noCacheFetch(adminEndpoint, options);

  // Handle common admin errors
  if (response.status === 401) {
    // Clear any potential cached data and redirect to login
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/api/auth/signin';
    }
    throw new Error('Authentication required');
  }

  if (response.status === 403) {
    // Clear cached data and redirect home
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/';
    }
    throw new Error('Admin access denied');
  }

  return response;
}

/**
 * Helper for admin API calls that automatically parse JSON
 */
export async function adminFetchJson<T = any>(
  endpoint: string,
  options: NoCacheFetchOptions = {}
): Promise<T> {
  const response = await adminFetch(endpoint, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Admin API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}
