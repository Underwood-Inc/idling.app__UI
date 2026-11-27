---
title: OCE recipe — Axios
description: Fetch adapter, interceptors, validateStatus, and reporter classification for Axios
---

# Recipe — Axios

**In plain terms:** Point Axios at **`OCE.fetch`** when using the fetch adapter. Otherwise use **`OCE.reporter`** in interceptors so classifications match native fetch.

## Recommended — fetch adapter

```ts
import axios from 'axios';
import { OCE } from '@lib/oce';

export const http = axios.create({
  adapter: 'fetch',
  fetch: OCE.fetch,
  timeout: 10_000,
  credentials: 'include',
});

const { data } = await http.get('/api/profile');
```

`OCE.fetch` settles the engine on every round trip — no extra interceptors required.

## When you cannot use the fetch adapter

Axios **rejects** when there is no `error.response`. When `error.response` exists — including failed `validateStatus` — OCE treats that as **`reportResponse`**, not a failed connection.

```ts
import axios from 'axios';
import { OCE } from '@lib/oce';

const client = axios.create({ timeout: 10_000 });

client.interceptors.response.use(
  (response) => {
    OCE.reporter.reportResponse();
    return response;
  },
  (error) => {
  const { reporter } = OCE;
    if (axios.isCancel(error)) {
      reporter.reportIgnored();
    } else if (error.response) {
      reporter.reportResponse();
    } else {
      reporter.reportTransportFailure();
    }
    return Promise.reject(error);
  },
);
```

Do **not** resolve with fallback objects in the error interceptor — that hides failures from both your app and OCE.

## `validateStatus: () => true`

HTTP errors **resolve** instead of reject. With **`fetch: OCE.fetch`**, settlement already happened. Without it, call `reportResponse()` on every fulfilled response.

## Timeouts

| Setting | Meaning |
| ------- | ------- |
| Axios `timeout` | Client aborts the request → usually `reportTransportFailure` (or cancel → `reportIgnored` if axios cancel) |
| OCE `probeDeadline` | Engine-owned health probe timeout only (`ConnectivityEngine` config) |

## Forbidden

```ts
if (OCE.engine.getSnapshot().unavailable) {
  return Promise.resolve({ data: staleCache });
}
```

User-initiated requests must still run (FR-OCE-006).

---

**Related:** [Getting started](/guides/offline-connectivity-engine/getting-started) · [Reporter](/guides/offline-connectivity-engine/reporter).