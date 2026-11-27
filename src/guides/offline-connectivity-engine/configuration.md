---
title: OCE configuration
description: failureThreshold, healthCheckUrl, probe deadline presets, and optional 204 health contract
---

# Configuration

**In plain terms:** the host passes a small config object when **first** creating the page engine. Remotes must not override it.

## Config type (specified public API)

```ts
export type OceProbeDeadline = 'Snappy' | 'Interactive' | 'Steady' | 'Background';

export const OCE_PROBE_DEADLINE_MS: Record<OceProbeDeadline, number> = {
  Snappy: 1000,
  Interactive: 5000,
  Steady: 10000,
  Background: 30000,
} as const;

export type ConnectivityEngineConfig = {
  /** Default 2 — failures below this do not probe */
  failureThreshold?: number;
  /** Same-origin URL for confirm step; default app-specific */
  healthCheckUrl: string;
  /** Preset name only — raw milliseconds are rejected (FR-OCE-009) */
  probeDeadline?: OceProbeDeadline;
  /** Default: any Response clears probe suspicion */
  interpretHealthResponse?: (response: Response) => boolean;
  /** Reuse a recent health outcome within this window (default 4000). */
  healthProbeReuseMs?: number;
  /** Debounce `online`/`offline` before health verify (default 600). */
  navigatorVerifyDebounceMs?: number;
  /** Debounce clearing `unavailable` after fetch `Response` (default 800). */
  recoveryDebounceMs?: number;
  /** Default true — listen to window online/offline and verify with health */
  listenToNavigatorOnLine?: boolean;
  /** Transport for engine-owned probes only; observed fetch uses app stack */
  baseFetch?: typeof fetch;
};

export const defaultConnectivityConfig: Required<
  Pick<ConnectivityEngineConfig, 'failureThreshold' | 'probeDeadline'>
> = {
  failureThreshold: 2,
  probeDeadline: 'Interactive',
};
```

## `failureThreshold`

| Value | Behavior |
| ----- | -------- |
| `1` | First **failed connection** triggers confirm (aggressive; use sparingly) |
| **`2` (default)** | One blip does not probe; two consecutive **failed connections** at same generation do |
| `n > 2` | More tolerance for flaky mobile links before probing |

Below threshold: `unavailable` stays **false**, health URL is **not** called for confirm.

## `healthCheckUrl`

Requirements:

- **Same-origin** — CORS/CSP/mixed-content `TypeError`s are indistinguishable from offline. A cross-origin health URL can false-trigger the flag.
- Served by your app or reverse proxy, not a third-party ping.
- **Service worker:** do not answer this path from Cache Storage (see [Edge cases](/guides/offline-connectivity-engine/edge-cases)).

```ts
const engine = OCE.engine;
```

If your health route returns **404** with a body: default contract treats 404 as a **Response** → suspicion clears. With 204-only mode, 404 can confirm `unavailable`.

## Probe deadline presets

Confirm step **must** give up. A hung probe is “lie-fi”: the socket never answers, so the flag never settles. Public config exposes **`probeDeadline`**, not `probeTimeoutMs`. A **number** is rejected so apps cannot drift to a fourth duration (FR-OCE-009).

| Preset | Deadline | Use when |
| ------ | -------- | -------- |
| `Snappy` | 1s | Surrounding client treats ~1s as one beat (e.g. Axios `timeout: 1000`, TanStack first `retryDelay` 1000ms) |
| **`Interactive`** | **5s** | **Default.** Confirm finishes before a person assumes the click is dead |
| `Steady` | 10s | App requests use ~10s client timeout (common explicit Axios setup) |
| `Background` | 30s | Work aligned with TanStack Query retry ceiling (`Math.min(1000 * 2 ** attempt, 30000)`) |

Axios default `timeout: 0` means the **client** request is not aborted — it does **not** copy onto the probe. The probe still uses a preset and aborts with `TimeoutError`, which counts as failed confirm (FR-OCE-009).

```ts
// Engine-owned probe (matches ConnectivityEngine — one AbortController at a time)
const owner = new AbortController();
const signal = mergeAbortSignals(
  owner.signal,
  AbortSignal.timeout(OCE_PROBE_DEADLINE_MS[config.probeDeadline ?? 'Interactive']),
);

await baseFetch(healthCheckUrl, {
  method: 'GET',
  cache: 'no-store',
  credentials: 'omit',
  signal,
});
```

**One page, one preset:** the host picks **one** `probeDeadline` for the shared probe. Remotes do not override (same rule as `healthCheckUrl`).

## Timing (idling.app defaults)

| Option | Default | Role |
| ------ | ------- | ---- |
| `healthProbeReuseMs` | `4000` | Avoid back-to-back engine GETs when outcome is still fresh |
| `navigatorVerifyDebounceMs` | `600` | Coalesce browser `online`/`offline` flicker |
| `recoveryDebounceMs` | `800` | Wait for stable `Response` before clearing `unavailable` from fetch |

`reporter.reportResponse()` does **not** use recovery debounce — manual success clears immediately.

Set in `OCE.ts` when constructing `ConnectivityEngine`.

### Picking a preset

Match the **user-visible wait you already promised**, not the library name:

- Axios app with `timeout: 10000` → `Steady`
- TanStack Query retries out to 30s → `Background` for probe
- Interactive save button → `Interactive` even if background queries use `Background`

## Optional 204 contract (`interpretHealthResponse`)

Default: `() => true` — **any** `Response` means the network answered for the confirm step.

Chrome-style captive portal detection treats **204** (or empty 200) as internet and **200 with HTML body** as a portal. OCE **defaults to product rule**: any `Response` clears suspicion so auto-recovery stays simple.

Opt in when portal detection matters:

```ts
new ConnectivityEngine({
  healthCheckUrl: '/api/version',
  interpretHealthResponse: (response) => response.status === 204,
});
```

When `interpretHealthResponse` returns `false`:

- Confirm step sets `unavailable = true`
- Snapshot includes `healthContractFailed: true`

**Split behavior:** ordinary API traffic still uses “any `Response` clears `unavailable`.” A portal HTML page on a normal API call can still recover the flag even when the health contract is strict.

---

**Sources (specified):** OCE plan — probe presets table, `interpretHealthResponse`, FR-OCE-009.