---
title: OCE reporter port
description: Tell OCE what happened when your code does not use fetch — same rules as OCE.fetch
---

# Reporter port

**In plain terms:** **`OCE.fetch`** (and **`noCacheFetch` / `apiFetch`**) **already report** — you do **not** call the reporter in `catch` after those calls. Use this page only when HTTP is **not** going through observed fetch (prefer **`OCE.bindHtmlMediaElement`** for media first).

## API (code names stay stable)

| Plain English | Call in code |
| ------------- | ------------ |
| Server sent an answer (any status) | `reportResponse()` |
| Request failed before any answer (offline, DNS, timeout, reset) | `reportTransportFailure()` |
| User cancelled — not an outage | `reportIgnored()` |

```ts
import { OCE } from '@lib/oce';

const { reporter } = OCE;

reporter.reportResponse();         // Got an answer
reporter.reportTransportFailure(); // No answer — connection problem
reporter.reportIgnored();          // Cancelled on purpose
```

Reporter calls use the **same** streak, threshold, and health-check rules as **`OCE.fetch`**.

Use reporter for:

- `<audio>` / `<video>` stream probes
- Axios without the fetch adapter
- XHR, WebSocket signaling, Electron `net`, native WebView bridges

## When to call what

| What happened | Call |
| ------------- | ---- |
| Got a `Response` or framework equivalent with status | `reportResponse()` |
| No response — timeout, offline, connection reset | `reportTransportFailure()` |
| User canceled — `AbortError`, axios cancel | `reportIgnored()` |

```ts
function onXhrLoad(xhr: XMLHttpRequest): void {
  const { reporter } = OCE;
  if (xhr.status !== 0) {
    reporter.reportResponse();
  } else {
    reporter.reportTransportFailure();
  }
}
```

## Prefer `OCE.fetch` when possible

```ts
// Axios — fetch adapter (recommended)
import { OCE } from '@lib/oce';

export const http = axios.create({
  adapter: 'fetch',
  fetch: OCE.fetch,
});
```

If you cannot use the fetch adapter, mirror outcomes in interceptors — see [Recipe — Axios](/guides/offline-connectivity-engine/recipes-axios).

## Forbidden

```ts
// Failure never reaches OCE
axios.interceptors.response.use(undefined, () => ({ data: null }));
```

Hiding connection failures stops the network hint from updating and slows “back online” messages.

## Audio example (idling radio)

```ts
import { IdlingOceEmbedRegistry } from 'widgets/radio-player/embedIdlingFetch';

const { reporter } = IdlingOceEmbedRegistry.engine();

audio.addEventListener('canplay', () => reporter.reportResponse());
audio.addEventListener('error', () => reporter.reportTransportFailure());
```

---

**Related:** [Getting started](/guides/offline-connectivity-engine/getting-started) · FR-OCE-005 (`reportIgnored`).