---
title: Attach fetch
description: Host bootstrap, microfrontend consumers, and api-framework secureFetch integration
---

# Attach fetch

**In plain terms:** observation belongs on the **transport**. The host wraps `fetch` once; every user-initiated call that should inform OCE must go through that wrapper (or the reporter port).

## Host attach (before remotes render)

```ts
import {
  getPageConnectivityEngine,
  type PageConnectivityEngine,
} from '@strixun/api-framework/connectivity';

let fetchWithOce: typeof fetch;

export function bootstrapOce(): PageConnectivityEngine {
  const engine = getPageConnectivityEngine({
    failureThreshold: 2,
    healthCheckUrl: '/health',
    probeDeadline: 'Interactive',
  });
  const base = globalThis.fetch.bind(globalThis);
  fetchWithOce = engine.attachFetch(base);
  return engine;
}

/** Pass to apps that accept a custom fetch implementation */
export function getFetchWithOce(): typeof fetch {
  if (!fetchWithOce) {
    throw new Error('Call bootstrapOce() at host entry before remotes load');
  }
  return fetchWithOce;
}
```

Entry bootstrap (Next.js, Vite host shell, etc.):

```tsx
// host/src/main.tsx
import { bootstrapOce } from './oce-bootstrap';

bootstrapOce();
// then render microfrontends
```

Rules:

1. Call `getPageConnectivityEngine` **once** with config at host startup.
2. Replace or inject `fetchWithOce` into shared clients **before** remote bundles execute.
3. Remotes call `getPageConnectivityEngine()` **without** `createConnectivityEngine`.

## Microfrontend remotes (subscribe only)

```tsx
// remote/src/ConnectivityHint.tsx
import { useEffect, useState } from 'react';
import { getPageConnectivityEngine } from '@strixun/api-framework/connectivity';

export function ConnectivityHint() {
  const engine = getPageConnectivityEngine();
  const [unavailable, setUnavailable] = useState(
    () => engine.getSnapshot().unavailable,
  );

  useEffect(() => {
    return engine.subscribe(() => {
      setUnavailable(engine.getSnapshot().unavailable);
    });
  }, [engine]);

  if (!unavailable) return null;
  return (
    <p role="status">We could not reach the network recently. You can still retry.</p>
  );
}
```

Remotes **must not**:

- Call `createConnectivityEngine` again
- Pass a different `healthCheckUrl` expecting it to apply
- Swap `globalThis.fetch` after the host attached

## Wiring HTTP clients to the wrapper

```ts
// Example: pass custom fetch into a thin client
import { getFetchWithOce } from '../host/oce-bootstrap';

export const api = createRestClient({
  baseUrl: '/api',
  fetch: getFetchWithOce(),
});
```

For TanStack Query, Apollo `HttpLink`, SWR `fetcher`, axios adapter — see [Recipes](/guides/offline-connectivity-engine/recipes-fetch).

## `@strixun/api-framework` `secureFetch`

`secureFetch` is `attachFetch` around the HTTPS-safe base fetch. `APIClient` call shape does not change. Apps already on the client inherit observation.

```ts
import { getPageConnectivityEngine } from '@strixun/api-framework/connectivity';

const engine = getPageConnectivityEngine();

function upgradeToHttps(input: RequestInfo | URL): RequestInfo | URL {
  // existing secureFetch policy — before or inside attach; observation sees final call
  return input;
}

const base = globalThis.fetch.bind(globalThis);

async function secureBaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const safeInput = upgradeToHttps(input);
  return base(safeInput, init);
}

export const secureFetch = engine.attachFetch(secureBaseFetch);
```

```ts
// api-framework consumer — unchanged call site
import { secureFetch } from '@strixun/api-framework';

const response = await secureFetch('/api/me', { credentials: 'include' });
```

See also the [API Framework](/products/showcase/api-framework) product page for package entry points.

## Subscribe API (read the hint)

```ts
const engine = getPageConnectivityEngine();

const unsubscribe = engine.subscribe(() => {
  const snap = engine.getSnapshot();
  // { unavailable, streak, failureThreshold, generation, healthContractFailed? }
  showHint(snap.unavailable);
});

// cleanup
unsubscribe();
```

## Apps without fetch

Stacks that use XHR, WebSocket-only signaling, or native bridges must use [`reporter`](/guides/offline-connectivity-engine/reporter) at the transport boundary. There is no dedicated axios or TanStack package — those call `attachFetch` or `reporter`.

## Service worker note

Host documentation should include a one-line worker bypass for `healthCheckUrl`. OCE does not ship a worker. Example pattern:

```js
// sw.js — do not cache the health probe
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/health') {
    return; // network only
  }
  // ... normal strategies
});
```

---

**Sources (specified):** OCE plan — attach recipes, secureFetch, one writer on the page, service worker advisory.