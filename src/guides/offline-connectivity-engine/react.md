---
title: OCE in React
description: useSyncExternalStore subscription pattern, server snapshot, and non-blocking UI hints
---

# React integration

**In plain terms:** subscribe with `useSyncExternalStore` so hints stay consistent in concurrent rendering. Show status; do **not** disable user actions based on `unavailable`.

## `useSyncExternalStore` pattern

```tsx
import { useSyncExternalStore } from 'react';
import {
  getPageConnectivityEngine,
  type ConnectivitySnapshot,
  SERVER_OCE_SNAPSHOT,
} from '@lib/oce/connectivity';

function subscribe(onStoreChange: () => void): () => void {
  const engine = getPageConnectivityEngine();
  return engine.subscribe(onStoreChange);
}

function getSnapshot(): ConnectivitySnapshot {
  return getPageConnectivityEngine().getSnapshot();
}

function getServerSnapshot(): ConnectivitySnapshot {
  return SERVER_OCE_SNAPSHOT;
}

export function useConnectivitySnapshot(): ConnectivitySnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useOceUnavailable(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getPageConnectivityEngine().getSnapshot().unavailable,
    () => false,
  );
}
```

### Why server snapshot is `unavailable: false`

SSR and the first client paint should not flash “offline” from a missing store. The engine exists on the client after host bootstrap; until then, assume reachable for hint purposes only — still **do not** block forms.

## Hint banner (allowed)

```tsx
export function OceStatusBanner() {
  const unavailable = useOceUnavailable();
  if (!unavailable) return null;
  return (
    <motion.div role="status" aria-live="polite" className="oce-banner">
      We are having trouble reaching the network. You can still try your action.
    </motion.div>
  );
}
```

## Form submit (non-blocking)

```tsx
export function ProfileForm() {
  const unavailable = useOceUnavailable();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await fetchWithOce('/api/profile', {
        method: 'PUT',
        body: new FormData(event.currentTarget),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <OceStatusBanner />
      {unavailable ? (
        <p className="text-muted">Last check suggested connectivity issues.</p>
      ) : null}
      <button type="submit" disabled={pending}>
        Save
      </button>
    </form>
  );
}
```

`disabled={pending}` is fine. **`disabled={unavailable}` is forbidden.**

## Microfrontend remote

Remotes import the hook; host already called `bootstrapOce()`:

```tsx
// remote/RemoteRoot.tsx
import { OceStatusBanner } from './OceStatusBanner';

export function RemoteRoot() {
  return (
    <>
      <OceStatusBanner />
      <RemoteFeature />
    </>
  );
}
```

## Testing components

```tsx
import { render, screen } from '@testing-library/react';
import { OceStatusBanner } from './OceStatusBanner';

test('banner hidden when available', () => {
  render(<OceStatusBanner />);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
```

Engine unit tests use injected `baseFetch` per plan TDD section — not `vi.mock('window.fetch')`.

## Anti-patterns in React

```tsx
// Forbidden
const unavailable = useOceUnavailable();
return (
  <button disabled={unavailable} onClick={save}>
    Save
  </button>
);
```

```tsx
// Forbidden — early return skips fetch
const unavailable = useOceUnavailable();
if (unavailable) return <CachedDashboard />;
return <LiveDashboard />;
```

Use suspense/cache for **data**, not for skipping the transport OCE must observe.

---

**Sources (specified):** OCE plan — React recipe `useSyncExternalStore`, non-blocking contract, MDN hint guidance.