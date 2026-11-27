---
title: OCE recipe — Axios
description: Interceptors, validateStatus, timeout 0, and reporter classification for Axios
---

# Recipe — Axios

**In plain terms:** Axios **rejects** when there is no `error.response` (network, timeout, cancel). When `error.response` exists — including failed `validateStatus` — OCE treats it as **`reportResponse`**, not transport failure. Default client `timeout: 0` does not change the OCE probe preset.

## Point axios at `fetchWithOce` (browser)

```ts
import axios from 'axios';
import { getPageConnectivityEngine } from '@lib/oce/connectivity';

const engine = getPageConnectivityEngine();
const fetchWithOce = engine.attachFetch(globalThis.fetch.bind(globalThis));

export const http = axios.create({
  adapter: 'fetch',
  fetch: fetchWithOce,
  timeout: 10000, // Steady — match probeDeadline on host if using 10s
});
```

If you cannot use the fetch adapter, install interceptors that call `reporter` (below).

## Response interceptor (required when not using attachFetch)

Swallow point: interceptors that `return` fallback objects or `.catch(() => ({ data: null }))` hide outcomes from app code.

```ts
import axios from 'axios';
import { getPageConnectivityEngine } from '@lib/oce/connectivity';

const client = axios.create({ timeout: 10000 });

client.interceptors.response.use(
  (response) => {
    getPageConnectivityEngine().reporter.reportResponse();
    return response;
  },
  (error) => {
    const engine = getPageConnectivityEngine();
    if (axios.isCancel(error)) {
      engine.reporter.reportIgnored();
    } else if (error.response) {
      // 4xx/5xx when validateStatus rejects — server answered
      engine.reporter.reportResponse();
    } else {
      // timeout, DNS, offline — no response
      engine.reporter.reportTransportFailure();
    }
    return Promise.reject(error); // do not convert into resolved continue
  },
);

export { client };
```

## `validateStatus: () => true`

HTTP errors **resolve** instead of reject. That is fine for OCE **if** the adapter still reports the response:

```ts
const client = axios.create({
  validateStatus: () => true,
  fetch: fetchWithOce,
});

client.interceptors.response.use((response) => {
  // attachFetch already classified if fetch adapter is wired
  return response;
});
```

Without `fetchWithOce`, call `reporter.reportResponse()` on every fulfilled response.

## `timeout: 0` vs probe preset

| Setting | Meaning |
| ------- | ------- |
| Axios `timeout: 0` | Client does **not** abort the request |
| OCE `probeDeadline` | Engine **does** abort the health probe using a preset (`Interactive` = 5s, etc.) |

Never set Axios `timeout: 0` expecting the health probe to wait forever. Pick `Steady` or `Background` on the host to match user-visible patience.

## Forbidden

```ts
// Forbidden
client.interceptors.response.use(undefined, () => ({ data: null }));

// Forbidden — gate on OCE flag
if (engine.getSnapshot().unavailable) {
  return Promise.resolve({ data: staleCache });
}
return client.get('/api/items');
```

## User-initiated calls always run

```ts
export async function saveSettings(payload: Settings) {
  // No unavailable guard — always POST
  await client.post('/api/settings', payload);
}
```

---

**Sources (specified):** OCE plan — Axios recipe, timeout 0 gotcha, FR-OCE-009, FR-OCE-010.