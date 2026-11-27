---
title: OCE reporter port
description: Report transport outcomes for non-fetch HTTP stacks with the same generation rules
---

# Reporter port

**In plain terms:** if your framework does not go through `attachFetch`, you still must tell the engine what the transport did — **before** interceptors turn errors into resolved fallbacks.

## API (specified)

```ts
export type ConnectivityReporter = {
  /** HTTP message received (any status, including 4xx/5xx) */
  reportResponse: (meta?: { url?: string }) => void;
  /** No Response — network, timeout, DNS, etc. */
  reportTransportFailure: (meta?: { url?: string }) => void;
  /** User or navigation cancel — AbortError equivalent */
  reportIgnored: (meta?: { url?: string }) => void;
};

// On the engine instance:
const { reporter } = getPageConnectivityEngine();
```

Reporter calls use the **same** generation, streak, threshold, and confirm rules as `attachFetch`. They are the adapter for:

- Axios with a custom adapter not wired to `fetch`
- Native mobile WebView bridges
- Electron `net` module wrappers
- gRPC-Web or other transports

## When to call what

| Outcome | Call |
| ------- | ---- |
| Got a `Response` (or framework equivalent with status) | `reportResponse()` |
| No response object — timeout, offline, connection reset | `reportTransportFailure()` |
| User canceled — `AbortError`, axios cancel | `reportIgnored()` |

```ts
function onXhrLoad(xhr: XMLHttpRequest, url: string): void {
  const engine = getPageConnectivityEngine();
  if (xhr.status !== 0) {
    engine.reporter.reportResponse({ url });
  } else {
    engine.reporter.reportTransportFailure({ url });
  }
}
```

## Order: report before continue

Framework interceptors that **resolve** with fallback data must report **first**:

```ts
axios.interceptors.response.use(
  (response) => {
    getPageConnectivityEngine().reporter.reportResponse();
    return response;
  },
  (error) => {
    const engine = getPageConnectivityEngine();
    if (axios.isCancel(error)) {
      engine.reporter.reportIgnored();
    } else if (error.response) {
      engine.reporter.reportResponse();
    } else {
      engine.reporter.reportTransportFailure();
    }
    return Promise.reject(error); // do not swallow after report
  },
);
```

Swallowing without reporting loses the signal and blocks recovery:

```ts
// Forbidden — failure never reaches OCE
axios.interceptors.response.use(undefined, () => ({ data: null }));
```

## Pairing with custom `attachFetch` stacks

Preferred path: point the HTTP layer at `fetchWithOce` so classification stays automatic. Use reporter only where fetch is not the bottom of the stack.

```ts
// Hybrid: graphql over fetch — use attachFetch, not reporter
import { getFetchWithOce } from './oce-bootstrap';

const link = new HttpLink({
  uri: '/graphql',
  fetch: getFetchWithOce(),
});
```

## Explicit cancel

If your stack distinguishes cancel from failure:

```ts
function onUserAbort(): void {
  getPageConnectivityEngine().reporter.reportIgnored();
}
```

`reportIgnored` must not increment streak or change `unavailable` (FR-OCE-005).

---

**Sources (specified):** OCE plan — agnostic core reporter methods, framework swallow points, FR-OCE-010.