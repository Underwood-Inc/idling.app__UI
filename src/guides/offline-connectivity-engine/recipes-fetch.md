---
title: OCE recipe — Fetch
description: attachFetch wrapper usage and forbidden deadlock patterns with native fetch
---

# Recipe — Fetch

**In plain terms:** `fetch` does not throw on HTTP status. `attachFetch` treats any `Response` as available and a rejection as transport failure, except `AbortError`. No extra framework config.

## Attach once

```ts
const engine = getPageConnectivityEngine({
  failureThreshold: 2,
  healthCheckUrl: '/health',
  probeDeadline: 'Interactive',
});

export const fetchWithOce = engine.attachFetch(globalThis.fetch.bind(globalThis));
```

## Caller pattern

```ts
export async function loadProfile(): Promise<Profile> {
  try {
    const response = await fetchWithOce('/api/profile', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as Profile;
  } catch (error) {
    showInlineError(error);
    throw error; // transport failure already recorded
  }
}
```

Allowed: catch for UI, then rethrow or return — the **fetch already ran**.

## Forbidden patterns

### Skip fetch when flag is true

```ts
// Forbidden — recovery never happens
const snap = engine.getSnapshot();
if (snap.unavailable) {
  return cachedProfile;
}
return fetchWithOce('/api/profile');
```

The only recovery path is **performing the call** in both branches:

```ts
// Correct — always hit the network
return fetchWithOce('/api/profile');
```

### Stub without attachFetch

```ts
// Forbidden — call bypassed OCE
try {
  return await rawFetch(url);
} catch {
  return new Response('{}', { status: 200 });
}
```

### try/catch that returns fake success

```ts
// Forbidden
try {
  return await fetchWithOce(url);
} catch {
  return { ok: true, data: null };
}
```

Use a hint banner instead of faking success.

## Opaque responses

Cross-origin `no-cors` may yield `opaque` responses. OCE still classifies them as **`response`** — the network answered.

```ts
const opaque = await fetchWithOce('https://cdn.example/asset', {
  mode: 'no-cors',
});
// opaque.type === 'opaque' → clears unavailable on success path
```

## Related recipes

- [Axios](/guides/offline-connectivity-engine/recipes-axios)
- [TanStack Query (React Query)](/guides/offline-connectivity-engine/recipes-tanstack-query)
- [Apollo Client](/guides/offline-connectivity-engine/recipes-apollo)
- [SWR](/guides/offline-connectivity-engine/recipes-swr)
- [Framework deadlocks](/guides/offline-connectivity-engine/framework-deadlocks)

---

**Sources (specified):** OCE plan — Fetch recipe, forbidden consumers, non-blocking contract.