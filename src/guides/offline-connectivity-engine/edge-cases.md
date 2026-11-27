---
title: OCE edge cases
description: Wi-Fi without internet, captive portals, service workers, CORS, and parallel failure gotchas
---

# Edge cases and gotchas

**In plain terms:** OCE is honest about ambiguity. This table is the expanded operator reference — behaviors come from the specified engine rules, not from `navigator.onLine`.

MDN states [`Navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) is unreliable and you **should not disable features based on it, only hint**. OCE never reads it.

| Case | Behavior |
| ---- | -------- |
| Wi‑Fi associated, no internet | Flag stays false until `failureThreshold` transport failures, then one probe. Probe fails transport → `unavailable`. `navigator.onLine` would still be `true`. |
| Captive portal returns 200 HTML | Ordinary API `Response`s clear the flag. Default probe also sees a `Response` and does **not** set `unavailable`. Opt in to [204-only](/guides/offline-connectivity-engine/configuration#optional-204-contract-interprethealthresponse) for portal detection (Chrome-style). |
| HTTP 500 / 404 | `Response`. Flag clears. App is unhealthy, not “offline.” |
| Single transport blip | Streak `1`. No probe. `unavailable` stays false. |
| Ten parallel failures | One probe. Streak reaches threshold once; mutex keeps streak consistent. |
| Success while probe in flight | Generation bumps; probe result discarded (FR-OCE-004). |
| User aborts request (`AbortError`) | Streak unchanged; `reportIgnored` / classify `ignored`. |
| User request `TimeoutError` | Counts as transport failure; increments streak. |
| CORS / CSP / mixed content | Indistinguishable from offline (`TypeError`). Use **same-origin** `healthCheckUrl`. |
| Service worker cache on health path | Can fake `Response`. Bypass cache for health URL; probe uses `cache: 'no-store'`. |
| Wrong health URL 404 | Default: 404 is `Response` → suspicion clears. 204-only mode: non-204 can confirm `unavailable`. |
| Quiet tab (no traffic) | No heartbeat timer in v1. Flag stays at last observation. |
| Axios `timeout: 0` | Client request not aborted. Probe still uses preset deadline; never “wait forever.” |
| Two remotes want different `probeDeadline` | Host preset wins — one engine, one probe budget. |
| Second bundle calls `createConnectivityEngine` | `Symbol.for` singleton returns existing engine (FR-OCE-007). |
| Cross-origin iframe | Separate engine; cannot read parent flag. |
| Another browser tab | Separate engine; each tab recovers from its own traffic. |
| Lie-fi (TCP hang) | Probe `TimeoutError` ends confirm; counts as failed confirm (FR-OCE-009). |
| `opaque` no-cors response | Still `response` — network answered. |
| Portal on API route only | Default any-`Response` clears flag on that traffic even when health uses 204-only. |
| Already `unavailable` | `attachFetch` still calls `baseFetch` (FR-OCE-006). |
| Health call in flight at threshold | Reuse that settlement; no duplicate health request (FR-OCE-008). |
| User aborts in-flight health observation | `AbortError` ignored; engine-owned probe runs if needed. |
| Electron / virtual NIC | Same as browser: rely on fetch outcomes, not OS “connected” icons. |
| PWA offline shell | Cached shell is not reachability; health path must hit network. |
| Intermittent DNS | Transport failures accumulate streak; recovery is next real `Response`. |

## Wi‑Fi with no upstream

Association ≠ routing. Users see full Wi‑Fi bars while DNS or default route fails. OCE waits for **transport** evidence, then one shared probe — it does not trust link-local “online” heuristics ([Financial Times labs note on `navigator.onLine`](https://labs.ft.com/2012/08/navigator-online-here-be-dragons/)).

## Captive portal nuance

Chrome/Android detectors treat **204** or empty **200** as internet and **200 + HTML body** as captive ([Chromium captive portal detector](https://chromium.googlesource.com/chromium/src/+/fa84fc8f1117c4b3c90244181829268e81b47d5a/components/captive_portal/core/captive_portal_detector.cc)). OCE **defaults** to any `Response` on the probe to favour auto-recovery. Strict portal mode is opt-in via `interpretHealthResponse`.

## Fetch failure taxonomy

Fetch rejects with `TypeError` for network, CORS, CSP, and mixed content — causes are [not distinguishable in user code](https://learn.sachinmaurya.com/browser/network-apis/fetch-resolves-on-errors). That is why confirm uses a **same-origin** health URL.

## Service worker checklist

1. Health probe request uses `cache: 'no-store'` from the engine.
2. Worker does **not** `respondWith` cached copy for `healthCheckUrl`.
3. Document the bypass in your PWA guide ([PWA offline UX context](https://progressivewebapps.com/caching/offline-ux/)).

```js
self.addEventListener('fetch', (event) => {
  const { pathname } = new URL(event.request.url);
  if (pathname === '/health') return;
});
```

## Parallel failure storm (microfrontends)

Many remotes failing together increments streak once per settled failure at the current generation. Only crossing `failureThreshold` triggers **one** `confirm`. Late stale failures after recovery are ignored via generation (see [Architecture](/guides/offline-connectivity-engine/architecture)).

## Requirement trace refs

| ID | Topic |
| -- | ----- |
| FR-OCE-001 | Any `Response` clears without health call on that path |
| FR-OCE-002 | Below threshold — no probe |
| FR-OCE-003 | Single-flight probe at threshold |
| FR-OCE-004 | Probe discard on generation bump |
| FR-OCE-005 | Abort vs timeout classification |
| FR-OCE-006 | Non-blocking when already unavailable |
| FR-OCE-007 | Singleton identity |
| FR-OCE-008 | Reuse in-flight health URL call |
| FR-OCE-009 | Probe preset deadlines only |

---

**Sources (specified):** OCE plan — gotchas table, research passes, MDN `Navigator.onLine`.