---
title: OCE recipe — Fetch
description: OCE.fetch usage and forbidden deadlock patterns with native fetch
---

# Recipe — Fetch (1/10)

[Framework recipes index](/guides/offline-connectivity-engine/recipes-index)

**In plain terms:** `fetch` does not throw on HTTP status. `OCE.fetch` treats any `Response` as **the server answered** and a rejection as **could not connect**, except `AbortError` (and idling SW cache hits — see [Edge cases](/guides/offline-connectivity-engine/edge-cases)).

## Idling.app

```ts
import { OCE } from '@lib/oce';

const response = await OCE.fetch('/api/profile', { credentials: 'include' });
```

No bootstrap, no wrapper factory — import and call.

## Agnostic host

```ts
const observed = engine.fetch(globalThis.fetch.bind(globalThis));
await observed('/api/profile', { credentials: 'include' });
```

## Caller pattern

```ts
export async function loadProfile(): Promise<Profile> {
  const response = await OCE.fetch('/api/profile', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as Profile;
}
```

Connection failures reject the promise; HTTP `4xx`/`5xx` still return a `Response` and clear `unavailable`.

## Forbidden

```ts
// Do not block on the hint
if (OCE.engine.getSnapshot().unavailable) return;

// Do not bypass OCE for UI-critical same-origin API if hints should update
await fetch('/api/profile');
```

## Parallel requests

Each call settles independently; generation tokens drop stale settlements after recovery.

---

**Sources:** FR-OCE-006 (non-blocking fetch), FR-OCE-001..003 (streak + confirm).