---
title: OCE in React
description: useSyncExternalStore subscription pattern, server snapshot, and non-blocking UI hints
---

# React integration

**In plain terms:** subscribe with `useSyncExternalStore` so hints stay consistent in concurrent rendering. Show status; do **not** disable user actions based on `unavailable`.

`useOceUnavailable()` is the banner switch. `useOceSnapshot()` adds **`streak`**, **`healthContractFailed`**, and thresholds — use it when copy should differ for health-contract failures (idling toasts already do). Field-by-field behavior: [Network flow](/guides/offline-connectivity-engine/network-flow).

## `useSyncExternalStore` pattern

```tsx
import { useOceSnapshot, useOceUnavailable } from '@lib/oce';

export function ConnectivityHint() {
  const snapshot = useOceSnapshot();
  const unavailable = useOceUnavailable();
  // ...
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
import { OCE, useOceUnavailable } from '@lib/oce';

export function ProfileForm() {
  const unavailable = useOceUnavailable();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await OCE.fetch('/api/profile', {
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

On idling.app, remotes use the same **`@lib/oce`** module (`OCE.engine` singleton). Import hooks or subscribe to `OCE.engine` from a host-provided reference on other stacks.

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

Use suspense/cache for **data**, not for skipping **`OCE.fetch`** calls OCE must see.

---

**Sources (specified):** OCE plan — React recipe `useSyncExternalStore`, non-blocking contract, MDN hint guidance.