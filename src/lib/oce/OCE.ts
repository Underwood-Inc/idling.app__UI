/**
 * idling.app Offline Connectivity Engine (OCE) — runtime singleton.
 *
 * Bootstraps once at import: native `fetch` → {@link ConnectivityEngine} settlements → `OCE.fetch`.
 * Does **not** replace `globalThis.fetch`. Attaches `online`/`offline` health verify on the client.
 * Radio embed receives the same transport via
 * {@link IdlingOceEmbedRegistry}.
 */

import { extractAndProcessWrapperData } from '@lib/hooks/useApiWrapperData';
import { IdlingOceEmbedRegistry } from '../../widgets/radio-player/embedIdlingFetch';
import { ConnectivityEngine } from './connectivity/ConnectivityEngine';

/** Health-check path used when the engine confirms connectivity after a failure streak. */
export const OCE_HEALTH_URL = '/api/version';

/** `RequestInit` plus optional caller-specific fields (admin clients, etc.). */
export type OCEFetchInit = RequestInit & Record<string, unknown>;

const SW_CACHE_HEADER = 'x-idling-sw-cache-served';
const CACHED_BODY = Symbol.for('idling.oce.cachedResponse');

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, private',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
  'X-Accel-Expires': '0',
  'X-Proxy-Cache': 'BYPASS',
  'X-Cache': 'MISS',
  Vary: '*',
  'Last-Modified': '0',
  ETag: 'no-cache',
} as const;

type Runtime = {
  engine: ConnectivityEngine;
  fetch: typeof fetch;
};

/** Bound native `fetch` (never patched on `globalThis`). */
function nativeFetch(): typeof fetch {
  return globalThis.fetch.bind(globalThis);
}

/**
 * Service worker cache hits are tagged with `x-idling-sw-cache-served: 1`.
 * OCE treats them as **ignored** settlements (not live network) but the caller still receives the body.
 */
async function idlingFetch(native: typeof fetch, input: RequestInfo | URL, init?: RequestInit) {
  const response = await native(input, init);
  if (response.headers.get(SW_CACHE_HEADER) === '1') {
    const error = new DOMException('SW cache ignored for OCE', 'AbortError') as DOMException & {
      [CACHED_BODY]: Response;
    };
    error[CACHED_BODY] = response;
    throw error;
  }
  return response;
}

/**
 * Single observed `fetch`: {@link ConnectivityEngine.fetch} records every outcome;
 * callers do not call {@link ConnectivityEngine.reporter} for HTTP.
 */
function createObservedFetch(
  engine: ConnectivityEngine,
  native: typeof fetch
): typeof fetch {
  const transport: typeof fetch = (input, init) => idlingFetch(native, input, init);
  const settledFetch = engine.fetch(transport);
  const fetchWithSwCacheUnwrap: typeof globalThis.fetch = async (input, init) => {
    try {
      return await settledFetch(input, init);
    } catch (error) {
      if (error && typeof error === 'object' && CACHED_BODY in error) {
        const cached = (error as { [CACHED_BODY]: Response })[CACHED_BODY];
        if (cached instanceof Response) {
          return cached;
        }
      }
      throw error;
    }
  };
  return fetchWithSwCacheUnwrap;
}

/** Constructs engine + observed fetch and registers the radio embed bridge. */
function createRuntime(): Runtime {
  const native = nativeFetch();
  const engine = new ConnectivityEngine({
    healthCheckUrl: OCE_HEALTH_URL,
    baseFetch: (input, init) => idlingFetch(native, input, init),
  });
  const fetch = createObservedFetch(engine, native);
  IdlingOceEmbedRegistry.register(fetch, engine);
  return { engine, fetch };
}

let navigatorOnLineDetach: (() => void) | null = null;

function bindNavigatorOnLine(engine: ConnectivityEngine): void {
  navigatorOnLineDetach?.();
  navigatorOnLineDetach = null;
  if (typeof globalThis.window !== 'undefined') {
    navigatorOnLineDetach = engine.attachNavigatorOnLine(globalThis.window);
  }
}

let runtime = createRuntime();
bindNavigatorOnLine(runtime.engine);

/**
 * Application entry for HTTP and connectivity state.
 *
 * Prefer `OCE.fetch` (or `useOceFetch()`) for traffic that should inform offline hints and toasts.
 */
export const OCE = {
  /**
   * Observed `fetch` — settlements are **automatic** (success, connection failure, cancel).
   * Do not call `reporter` for traffic that goes through this function.
   * @param input - Request URL, `Request`, or `URL`.
   * @param init - Standard `fetch` init.
   */
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return runtime.fetch(input, init);
  },

  /**
   * Non-`fetch` streams: attach connectivity reporting to a media element.
   * @returns Detach listeners.
   */
  bindHtmlMediaElement(
    element: Pick<
      HTMLMediaElement,
      'addEventListener' | 'removeEventListener' | 'src' | 'load'
    >
  ): () => void {
    return runtime.engine.bindHtmlMediaElement(element);
  },

  /** Engine instance behind this singleton (snapshots, subscribe, health confirm). */
  get engine(): ConnectivityEngine {
    return runtime.engine;
  },

  /** Reporter port for non-`fetch` transports (WebSocket, audio, etc.). */
  get reporter() {
    return runtime.engine.reporter;
  },

  /** Vitest-only: rebuild transport and engine after stubbing `globalThis.fetch`. */
  resetForTests(): void {
    navigatorOnLineDetach?.();
    navigatorOnLineDetach = null;
    runtime = createRuntime();
    bindNavigatorOnLine(runtime.engine);
  },

  /**
   * Cache-busting `fetch` for admin and polling paths.
   * Appends query noise and anti-cache headers, then calls {@link OCE.fetch}.
   */
  async noCacheFetch(
    input: string | URL | Request,
    init?: OCEFetchInit
  ): Promise<Response> {
    const urlString = typeof input === 'string' ? input : input.toString();
    const separator = urlString.includes('?') ? '&' : '?';
    const uniqueUrl = `${urlString}${separator}_t=${Date.now()}&_r=${Math.random().toString(36).slice(2)}&_nc=1`;

    const headers = new Headers(NO_CACHE_HEADERS);
    const raw = init?.headers;
    if (raw) {
      if (raw instanceof Headers) {
        raw.forEach((value, key) => headers.set(key, value));
      } else if (Array.isArray(raw)) {
        for (const [key, value] of raw) {
          if (value !== undefined) {
            headers.set(key, value);
          }
        }
      } else {
        for (const [key, value] of Object.entries(raw)) {
          if (value !== undefined) {
            headers.set(key, String(value));
          }
        }
      }
    }

    return runtime.fetch(uniqueUrl, {
      ...init,
      headers,
      credentials: init?.credentials ?? 'include',
      cache: 'no-store',
    });
  },

  /**
   * Same-origin `/api` `fetch` with auth redirect handling (401 → sign-in, 403 → home).
   */
  async apiFetch(endpoint: string, init?: OCEFetchInit): Promise<Response> {
    const path = endpoint.startsWith('/api')
      ? endpoint
      : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await OCE.noCacheFetch(path, init);

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/api/auth/signin';
      }
      throw new Error('Authentication required');
    }
    if (response.status === 403) {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/';
      }
      throw new Error('Access denied');
    }
    return response;
  },

  /**
   * `apiFetch` + JSON parse and API wrapper unwrapping ({@link extractAndProcessWrapperData}).
   * @throws When response is not `ok` or JSON is invalid.
   */
  async apiFetchJson<T = unknown>(endpoint: string, init?: OCEFetchInit): Promise<T> {
    const response = await OCE.apiFetch(endpoint, init);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${await response.text()}`);
    }
    return extractAndProcessWrapperData(await response.json()) as T;
  },
};

/** Full name for {@link OCE} — same singleton, unabbreviated import style. */
export const OfflineConnectivityEngine = OCE;

/** Type of the idling.app runtime singleton (`OCE` / `OfflineConnectivityEngine`). */
export type OfflineConnectivityEngineApi = typeof OCE;