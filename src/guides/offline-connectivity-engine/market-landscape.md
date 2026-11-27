---
title: Market landscape
description: How OCE compares to data libraries, offline-first stacks, and fetch wrappers — and what idling.app deliberately does not build
sidebar_position: 5
---

# Market landscape

**In plain terms:** Most products solve **caching, retries, or queued writes**. OCE solves **one boolean hint from whether real requests got a server response**. It is not a replacement for TanStack Query, Workbox, or PowerSync.

## Category map

| Category | Examples | Primary job | Overlap with OCE |
| -------- | -------- | ----------- | ---------------- |
| **Drop-in fetch wrapper** | [offline-fetch](https://github.com/john-doherty/offline-fetch) | Cache responses + optional offline reads (`x-offline-cache` header) | Same **network call** layer; OCE does not cache bodies — idling uses SW + `x-idling-sw-cache-served` to **ignore** cache for settlement only |
| **Offline queue / replay** | [offline-retry-sdk](https://github.com/i-brad/offline-retry-sdk), [Oracle Offline Persistence Toolkit](https://github.com/oracle/offline-persistence-toolkit), PowerSync upload queue | Persist failed **mutations**, FIFO replay on reconnect | **No overlap** — OCE does not queue writes |
| **Client data libraries** | [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode), [SWR](https://swr.vercel.app/docs/revalidation) | Stale/revalidate, retries, paused queries | **Complementary** — pass `OCE.fetch` as fetcher; do not duplicate connectivity state inside Query/SWR |
| **PWA / SW routing** | [Workbox](https://developer.chrome.com/docs/workbox/modules/workbox-strategies) strategies | Cache-first, network-first, timeouts | OCE stays in **app JS**; SW serves cache; header marks synthetic hits |
| **Framework offline (experimental)** | [Next.js `useOffline`](https://nextjs.org/docs/app/guides/offline-support) | Hold RSC / Server Actions pending until network returns | Framework-owned; client `fetch()` still uses library retry policies |
| **Hyper Fetch / Axios stacks** | Hyper Fetch `onRequest`, axios interceptors | Auth, logging, retries, error shape | **Different layer** — OCE does not expose interceptor chains; hosts call `OCE.fetch` or wire `engine.fetch(base)` once |

## What the market agrees on (2024–2026)

Sources: [MDN `navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine), [PWA offline UX patterns](https://progressivewebapps.com/caching/offline-ux/), [Agily offline guidance](https://agily.app/frontend-engineering/reliability/offline-and-retries/), TanStack [network mode discussion](https://github.com/TanStack/query/issues/2927).

1. **`onLine` is a hint, not a test.** `false` is fairly trustworthy; `true` is not internet proof (LAN, captive portal, lie-fi).
2. **Observe real requests** (or a dedicated same-origin health probe), not interface state alone.
3. **Non-blocking UX** — banners and toasts; do not disable primary actions on a connectivity flag ([web.dev offline UX](https://web.dev/articles/offline-ux-design-guidelines)).
4. **Separate “offline” from “API down”** — HTTP `5xx` with a body still means **the server answered**; messaging differs from DNS failure ([error-recovery.com connectivity patterns](https://www.error-recovery.com/pwa-offline-recovery-service-worker-resilience/connectivity-detection-and-offline-ux-patterns/)).
5. **Debounce flapping** — `online` events fire before the internet works; confirm with a probe or the next real request (OCE: streak + single-flight health confirm).
6. **Data libraries pause retries** on `navigator.onLine` — TanStack v5 moved away from trusting it; SWR uses it for `revalidateOnReconnect` / `refreshWhenOffline`. OCE intentionally **does not** read `onLine`; it learns from `fetch` rejections and responses.

## TanStack Query vs OCE

| | TanStack Query | OCE |
| - | -------------- | --- |
| **Unit** | Query / mutation | Per-page engine + observed `fetch` |
| **Offline reads** | Cache / `networkMode: 'offlineFirst'` | Not its job |
| **Pause retries** | `isPaused`, `networkMode: 'online'` | Not its job |
| **Global “we look offline”** | `onlineManager` (optional) | `getSnapshot().unavailable` |
| **Integration** | `queryFn: () => fetch(...)` — use **`OCE.fetch`** as that fetch |

## SWR vs OCE

SWR: global `onError`, `revalidateOnReconnect`, exponential backoff on fetcher errors. OCE: classify each **request outcome** for a **page-wide** hint; use `useOceUnavailable()` for banners, not to block SWR.

## Offline-first sync (PowerSync, Electric, Replicache)

These own **local DB + sync + upload queues**. OCE is **not** a sync engine. Idling.app uses OCE for **hints and toasts** only; business data stays on server APIs + normal fetch paths.

## Where idling.app sits

```text
User code ──► OCE.fetch (same signature as fetch)
                 ├─► settlements → snapshot / toasts
                 └─► native fetch (globalThis untouched)
```

**Learning model (scales with traffic):** No background heartbeat while idle. Observations come from **user and app-initiated HTTP**. After a failure streak, **one** shared health GET (`/api/version`) confirms before `unavailable: true` — aligned with market “probe on doubt, not constant ping.”

## Deliberate non-goals

| Non-goal | Why |
| -------- | --- |
| Request queue / Background Sync | Different product (Oracle OPT, Workbox sync) |
| Replacing React Query / SWR | They own cache + retry |
| `navigator.onLine` as source of truth | Documented unreliable |
| Patching `globalThis.fetch` | Host and third-party scripts stay isolated |
| Interceptor / middleware API | Hosts choose one observed `fetch` reference |

## Coverage gaps (idling.app)

Traffic that still calls **bare `fetch`** does not update OCE (toasts and snapshot stay stale). Admin, profile, batch decorations, and several app routes are known bypasses — migrate to `OCE.fetch` when those paths should inform connectivity.

## Agnostic host (not idling)

```ts
import { ConnectivityEngine } from '@your-scope/connectivity';

const engine = new ConnectivityEngine({
  healthCheckUrl: '/api/version',
  baseFetch: globalThis.fetch.bind(globalThis),
});

export const appFetch = engine.fetch(globalThis.fetch.bind(globalThis));
// Call sites: await appFetch(url, init) — same as fetch
```

Idling.app equivalent: `import { OCE } from '@lib/oce'` — no extra bootstrap type.

## Further reading

- [Index](/guides/offline-connectivity-engine) — signal vs promise, non-blocking rule
- [Attach fetch](/guides/offline-connectivity-engine/attach-fetch) — idling bootstrap
- [Edge cases](/guides/offline-connectivity-engine/edge-cases) — SW cache, captive portal, CORS