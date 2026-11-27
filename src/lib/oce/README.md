# Offline Connectivity Engine (OCE)

## What it is

**OCE is a page-wide “can we reach the server?” signal** for browser apps.

- You run normal HTTP requests through **`OCE.fetch`** (same as `fetch`).
- OCE tracks whether those requests **got an answer from the server** or **failed to connect**.
- A **snapshot**, not one bit: **`unavailable`** (confirmed outage), **`streak`** (consecutive connection failures), optional **`healthContractFailed`** (health URL answered but failed your rules), plus **`generation`** / **`failureThreshold`** for tuning and stale-safe updates.
- **`unavailable: true`** only after **two** consecutive connection failures (default) **and** a failed health check — a single blip does **not** flip the banner.
- **Recovery is automatic:** when any tracked request **gets a response back** (even 404 or 500), **`unavailable`** clears — you do not tap “go online” or call a reset API.
- **Timeouts:** **`TimeoutError`** counts as connection failed; user **cancel** (`AbortError`) does not.
- With **`<OceProvider>`**, idling.app can show **“Network trouble”** / **“Back online”** toasts when that flag changes.

**In one sentence:** a **network health signal that fixes itself** when the next request proves the server answered again.

## What it is not

| OCE is not… | Because… |
| ----------- | -------- |
| Proof the internet works everywhere | Wi‑Fi can look connected but still fail; this is a **hint** |
| The browser’s “Offline” icon | OCE listens to **`online`/`offline` events** but **verifies with health** — it does not trust `navigator.onLine` alone |
| An offline saver / sync queue | It does not store requests to send later |
| A reason to grey out buttons | Users can **always** retry; the flag is for messages only |
| Your API error handling | You still handle “404 Not found” and “500 Server error” yourself |

**Imports:** `OCE` or `OfflineConnectivityEngine` (same singleton) from `@lib/oce`.

## How the signal moves

```text
Several requests fail to connect → OCE may show unavailable: true
        ↓
Next OCE.fetch that gets a response from the server → unavailable: false
```

If the app never uses **`OCE.fetch`**, the signal never updates.

### Plain English vs code names

| What happened | Snapshot / UX | OCE API (code) |
| ------------- | ------------- | -------------- |
| Server sent a response (any status) | `unavailable=false`, `streak=0` | `response` settlement |
| One connection failure (threshold 2) | `streak=1`, still available | No health probe yet |
| Two failures + health probe fails | `unavailable=true` | Confirm sets outage |
| Health answered but wrong contract (opt-in) | `healthContractFailed=true` | `interpretHealthResponse` |
| Request failed before any response (DNS, timeout, …) | `streak++` | Connection-failed settlement |
| User cancelled the request | Streak unchanged | `ignored` / `reportIgnored()` |

Engineers may see **`reportTransportFailure`** in code — that means **“this request never got a server response.”**

---

## Automatic reporting (you do not call `reporter`)

**`OCE.fetch`**, **`OCE.noCacheFetch`**, and **`OCE.apiFetch`** / **`apiFetchJson`** already record every outcome on the engine:

- **`Response`** (any status) → healthy path, updates **`lastHealthyAt`**
- **Rejected** connection (DNS, timeout, …) → failure streak / health confirm
- **`AbortError`** (cancel or idling SW cache marker) → ignored for streak

Your `try` / `catch` is only for **your** UI and business errors — not for calling **`OCE.reporter`**.

For **`<audio>` / `<video>`** streams use **`OCE.bindHtmlMediaElement(element)`** (same auto-reporting, not manual reporter).

---

## Two kinds of errors (your app vs OCE)

| What the user cares about | What `OCE.fetch` does | Your UI | OCE signal |
| ------------------------- | --------------------- | ------- | ---------- |
| **Could not connect** | Promise **rejects** | “Check your connection” | May turn **unavailable** on |
| **Server said no** (401, 404, 500) | Promise **resolves**, `ok` is false | “Not found” / “Server error” | Treats as **connected** — flag **off** |
| **Success** | Resolves, `ok` is true | Show data | Flag **off** |

**Rule for OCE:** it only asks *“did the server send something back?”* — not *“was the user happy with the status code?”*

---

## New React app walkthrough

### 1. Bootstrap once

```tsx
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OceProvider } from '@lib/oce';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OceProvider>
      <App />
    </OceProvider>
  </StrictMode>
);
```

`<OceProvider>` connects **network toasts** (“Network trouble” / “Back online”). You still show your own errors per request.

### 2. Shared loader (connection vs server error)

```ts
// api/loadMe.ts
import { OCE } from '@lib/oce';

export type Me = { name: string };

export type LoadMeResult =
  | { ok: true; data: Me }
  | { ok: false; kind: 'server'; status: number; body: string }
  | { ok: false; kind: 'connection'; message: string };

export async function loadMe(): Promise<LoadMeResult> {
  try {
    const res = await OCE.fetch('/api/me', { credentials: 'include' });

    if (!res.ok) {
      return {
        ok: false,
        kind: 'server',
        status: res.status,
        body: await res.text().catch(() => ''),
      };
    }

    return { ok: true, data: (await res.json()) as Me };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not reach the server';
    return { ok: false, kind: 'connection', message };
  }
}
```

**Client app code:** call **`OCE.fetch`**, **`OCE.noCacheFetch`**, or **`OCE.apiFetch`** from `@lib/oce` (or wire your existing client helper to those — do not add another wrapper). Plain `globalThis.fetch` does not update the signal.

### 3. Screen: per-request errors and the network banner

```tsx
// App.tsx
import { useCallback, useEffect, useState } from 'react';
import { useOceUnavailable } from '@lib/oce';
import { loadMe, type LoadMeResult } from './api/loadMe';

export default function App() {
  const networkTrouble = useOceUnavailable();
  const [result, setResult] = useState<LoadMeResult | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setResult(await loadMe());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main>
      {networkTrouble ? (
        <p role="status" aria-live="polite">
          We are having trouble reaching the network. You can still try again.
        </p>
      ) : null}

      {loading && !result ? <p>Loading…</p> : null}
      {result?.ok === true ? <h1>Hello, {result.data.name}</h1> : null}

      {result?.ok === false && result.kind === 'server' ? (
        <p role="alert">Server error {result.status}{result.body ? `: ${result.body}` : ''}</p>
      ) : null}

      {result?.ok === false && result.kind === 'connection' ? (
        <p role="alert">Could not connect: {result.message}</p>
      ) : null}

      <button type="button" onClick={() => void refresh()} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </main>
  );
}
```

**Two layers:**

- **`result`** — how *this* request went (your message).
- **`networkTrouble`** — whether *recent requests overall* looked flaky (banner only). You can see the banner and still load data on retry, or get a server error while the banner is hidden.

### 4. POST with JSON

Same pattern: `try` / `catch` for **could not connect**, `res.ok` for **server said no**.

Do **not** skip requests when `useOceUnavailable()` is true — that stops automatic recovery.

---

## Helpers on idling.app

| API | When |
| --- | ---- |
| **`OCE.fetch`** | Default — updates the network signal |
| **`OCE.noCacheFetch`** | Force a fresh request (admin, polling) |
| **`OCE.apiFetch`** | `/api` paths plus sign-in redirect on 401/403 |
| **`OCE.apiFetchJson`** | JSON helper — throws on failure (read the error message) |

---

## React hooks

| Hook | Use |
| ---- | --- |
| **`useOceUnavailable()`** | Banner: “network looks rough” |
| **`useOceSnapshot()`** | Full state for advanced UI (incl. **`lastHealthyAt`**) |
| **`useOceLastHealthyAt()`** | UTC ms of last confirmed healthy observation, or `null` |
| **`useOceFetch()`** | Hand `OCE.fetch` to other libraries |
| **`useOceReporter()`** | Last resort when neither **`OCE.fetch`** nor **`bindHtmlMediaElement`** applies |

---

## When the request is not `fetch`

Prefer **`OCE.bindHtmlMediaElement(audio)`** for media elements.

For XHR-only stacks, WebSockets, or native bridges with no `fetch` adapter, use **`OCE.reporter`** at the lowest layer (last resort).

---

## Hard rules

1. Do **not** disable buttons when `useOceUnavailable()` is true.  
2. Do **not** skip `OCE.fetch` because the banner is showing.  
3. Do **check `response.ok`** — OCE does not throw on 404/500.  
4. Route important API calls through **`OCE.fetch`** — **`globalThis.fetch` does not auto-report**.  
5. OCE does **not** replace **`globalThis.fetch`** for the rest of the page.  
6. **Never** call **`reporter`** after **`OCE.fetch`** — settlements already ran.

---

## Learn more

| Doc | |
| --- | --- |
| [Network flow](/guides/offline-connectivity-engine/network-flow) | Snapshot fields, mermaid scenarios, timeouts |
| [Getting started](/guides/offline-connectivity-engine/getting-started) | Full guide |
| [Framework recipes ×10](/guides/offline-connectivity-engine/recipes-index) | Axios, TanStack Query, SWR, … |
| [Reporter](/guides/offline-connectivity-engine/reporter) | Non-`fetch` requests |

**Tests:** `pnpm exec vitest run src/lib/oce`