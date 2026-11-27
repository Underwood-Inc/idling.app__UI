---
title: OCE recipe — TanStack Query
description: React Query networkMode always, onlineManager, retries, and Background probe preset
---

# Recipe — TanStack Query (React Query)

**In plain terms:** [TanStack Query](https://tanstack.com/query/latest) is the current name for the library many docs still call **React Query**. OCE only learns from traffic that actually hits the network. Default `networkMode: 'online'` **pauses** `queryFn` when the client believes it is offline — wiring that belief to OCE's own flag causes a **deadlock**.

## Required: `networkMode: 'always'` for user work

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { OCE } from '@lib/oce';

export function useSaveProfile() {
  return useMutation({
    mutationFn: async (body: Profile) => {
      const res = await OCE.fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json();
    },
    networkMode: 'always',
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await OCE.fetch('/api/dashboard');
      if (!res.ok) throw new Error('Load failed');
      return res.json();
    },
    networkMode: 'always',
  });
}
```

`always` means TanStack will not pause for online/offline. Failures surface as `error` instead of sitting in `paused`.

## Do not wire `onlineManager` to OCE

```ts
// Forbidden — pauses queries when OCE says unavailable → no traffic → flag never clears
import { onlineManager } from '@tanstack/react-query';

onlineManager.setEventListener((setOnline) => {
  const engine = OCE.engine;
  return engine.subscribe(() => {
    setOnline(!engine.getSnapshot().unavailable);
  });
});
```

Leave `onlineManager` assuming online; let `OCE.fetch` see each attempt. TanStack [stopped reading `navigator.onLine`](https://tanstack.com/query/latest/docs/reference/onlineManager) in v5 for similar false-negative reasons — align with that stance.

## `refetchOnReconnect`

With `networkMode: 'always'`, `refetchOnReconnect` defaults false in this mode. **Leave it false** — browser `online` events are not proof of reachability.

## Retries must use `OCE.fetch`

Default `retry` (3) and `retryDelay` (1s, 2s, 4s, cap 30s) re-enter `queryFn`. Each attempt must go through `OCE.fetch`.

```ts
// Forbidden inside queryFn — swallows failure for OCE unless engine.fetch already ran
queryFn: async () => {
  try {
    return await OCE.fetch('/api/x').then((r) => r.json());
  } catch {
    return cachedX;
  }
},
```

## Polling

`refetchInterval` loops are fine. **Do not** clear the interval when `unavailable` is true — stopping polling removes traffic that would recover the flag.

```tsx
useQuery({
  queryKey: ['heartbeat'],
  queryFn: () => OCE.fetch('/api/ping').then((r) => r.ok),
  refetchInterval: 30_000,
  networkMode: 'always',
});
```

## Probe preset for long retry windows

If retries run out to 30s, host config should use `probeDeadline: 'Background'` so confirm is not shorter than client patience (see [Configuration](/guides/offline-connectivity-engine/configuration)).

## Avoid `offlineFirst` for OCE-informed queries

`offlineFirst` may run `queryFn` once against a service worker then pause. First hit can be cache that looks like a `Response`. Prefer `always` for queries that should inform OCE.

## Provider bootstrap

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { bootstrapEngine } from './oce-bootstrap';

bootstrapEngine();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { networkMode: 'always' },
    mutations: { networkMode: 'always' },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

## Deadlock sketch

```text
if oce.unavailable → query paused → no fetch → flag stays unavailable → query stays paused
```

Fix: `networkMode: 'always'` + never gate `queryFn` on the flag. Details in [Framework deadlocks](/guides/offline-connectivity-engine/framework-deadlocks) and FR-OCE-010.

---

**Sources (specified):** OCE plan — TanStack recipe, onlineManager, retryer.ts reference, FR-OCE-010.