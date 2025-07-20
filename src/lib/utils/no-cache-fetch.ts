/**
 * GLOBAL NO-CACHE FETCH UTILITY
 *
 * Ensures ALL requests are NEVER cached anywhere - browser, proxy, CDN, etc.
 * Import and use these functions instead of native fetch.
 *
 * WHY: Prevents permission bypass through cached responses for ANY route.
 */

/**
 * AGGRESSIVE NO-CACHE HEADERS
 * Prevents caching at EVERY level - browser, proxy, CDN, edge, everything
 */
const GLOBAL_NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, private',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
  'X-Accel-Expires': '0',
  'X-Proxy-Cache': 'BYPASS',
  'X-Cache': 'MISS',
  Vary: '*',
  'Last-Modified': '0',
  ETag: 'no-cache'
} as const;

/**
 * GLOBAL FETCH REPLACEMENT
 *
 * Use this instead of native fetch for ALL requests.
 * Adds timestamps and cache-busting to ensure NO caching anywhere.
 */
export async function noCacheFetch(
  input: string | URL | Request,
  init?: any
): Promise<Response> {
  // Convert input to string URL
  const urlString = typeof input === 'string' ? input : input.toString();

  // Add timestamp and random to URL for uniqueness
  const separator = urlString.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const uniqueUrl = `${urlString}${separator}_t=${timestamp}&_r=${random}&_nc=1`;

  // Merge global no-cache headers with any existing headers
  const existingHeaders = init?.headers || {};
  const headers = {
    ...GLOBAL_NO_CACHE_HEADERS,
    ...(typeof existingHeaders === 'object' && existingHeaders !== null
      ? existingHeaders
      : {})
  };

  // Force no-cache options
  const fetchOptions = {
    ...init,
    headers,
    credentials: init?.credentials || 'include',
    cache: 'no-store'
  };

  return fetch(uniqueUrl, fetchOptions);
}

/**
 * API FETCH with automatic error handling
 */
export async function apiFetch(
  endpoint: string,
  init?: any
): Promise<Response> {
  // Ensure endpoint starts with /api
  const apiEndpoint = endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await noCacheFetch(apiEndpoint, init);

  // Handle authentication errors globally
  if (response.status === 401) {
    // Clear ALL storage and redirect to login
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/api/auth/signin';
    }
    throw new Error('Authentication required');
  }

  if (response.status === 403) {
    // Clear ALL storage and redirect home
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/';
    }
    throw new Error('Access denied');
  }

  return response;
}

/**
 * API FETCH with automatic JSON parsing
 */
export async function apiFetchJson<T = any>(
  endpoint: string,
  init?: any
): Promise<T> {
  const response = await apiFetch(endpoint, init);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Export as default for easy importing
export default noCacheFetch;
