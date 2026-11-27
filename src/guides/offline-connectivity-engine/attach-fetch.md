---
title: Attach fetch
description: Host bootstrap, microfrontend consumers, and api-framework secureFetch integration
---

# Attach fetch

**In plain terms:** OCE only learns from requests you **route through it**. Call **`OCE.fetch`** (idling.app) or **`engine.fetch(base)`** once per host; user traffic that should update the network hint must use that function (or `reporter` when you are not using `fetch`).

## Idling.app entry

The site uses **`OCE`** from `@lib/oce`. **Do not** patch `globalThis.fetch`.

Mount `<OceProvider>` at host chrome (`SiteChromeProviders`):

```tsx
import { OceProvider } from '@lib/oce';

<OceProvider>{children}</OceProvider>
```

Client consumption:

```ts
import { OCE, useOceReporter } from '@lib/oce';

await OCE.fetch('/api/foo').then((r) => r.json());
await OCE.noCacheFetch('/api/admin/alerts');
const data = await OCE.apiFetchJson('/api/...');

// Media streams — auto-report (not manual reporter)
OCE.bindHtmlMediaElement(audioElement);
```

Radio embed sources import `./embedIdlingFetch`, which delegates to the same **`OCE.fetch`** when the Next app loads `@lib/oce` (`IdlingOceEmbedRegistry.register`).

## Generic host (agnostic)

```ts
import { ConnectivityEngine } from '@your-scope/connectivity';

const native = globalThis.fetch.bind(globalThis);
const engine = new ConnectivityEngine({
  healthCheckUrl: '/api/version',
  baseFetch: native,
});

/** Observed fetch — same signature as `fetch`. */
export const appFetch = engine.fetch(native);
```

Rules:

1. Construct **one** `ConnectivityEngine` at host startup.
2. Export **one** observed `fetch` (`appFetch` / `OCE.fetch`).
3. Remotes subscribe to the **same engine reference** — do not call `new ConnectivityEngine` again.
4. **Never** replace `globalThis.fetch`.

## Microfrontend remotes (subscribe only)

```tsx
import { useOceSnapshot, useOceUnavailable } from '@lib/oce';

export function ConnectivityHint() {
  const unavailable = useOceUnavailable();
  if (!unavailable) return null;
  return (
    <p role="status">We could not reach the network recently. You can still retry.</p>
  );
}
```

Remotes **must not** swap in a different `healthCheckUrl` or patch `globalThis.fetch` after attach.

## Wiring HTTP clients

Pass `OCE.fetch` or `appFetch` as the `fetch` implementation:

```ts
// TanStack Query
useQuery({ queryKey: ['x'], queryFn: () => OCE.fetch('/api/x').then((r) => r.json()) });

// SWR
useSWR('/api/x', (url) => OCE.fetch(url).then((r) => r.json()));
```

See [Recipes](/guides/offline-connectivity-engine/recipes-fetch).

## `@strixun/api-framework` (monorepo)

Workers may use `secureFetch` from `@strixun/api-framework` — same idea as `engine.fetch(secureBase)`. **Idling.app** uses `OCE.fetch` only.

## Subscribe API (read the hint)

```ts
const engine = OCE.engine;

const unsubscribe = engine.subscribe(() => {
  const snap = engine.getSnapshot();
  showHint(snap.unavailable);
});

unsubscribe();
```

## Apps without fetch

Use [`reporter`](/guides/offline-connectivity-engine/reporter) at the **lowest layer** where you know if the server answered (XHR-only, native bridges).

## Service worker note

Do not cache the health probe path. OCE idling uses `/api/version` with `cache: 'no-store'` on engine-owned probes.

---

**See also:** [Market landscape](/guides/offline-connectivity-engine/market-landscape) — how this differs from Query, SWR, and queue products.