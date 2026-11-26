---
title: ServiceWorkerRegistration
description: Production service worker lifecycle and cache hygiene
---

# ServiceWorkerRegistration

Client `useEffect` (skipped when `NODE_ENV !== 'production'`):

1. `enforceOneServiceWorker()` — remove duplicate registrations.
2. Clear all `caches` entries before registering `/sw.js`.
3. Register with `navigator.serviceWorker.register`, handle updates, `controllerchange`, and `message` events for skip-waiting / hard-reset coordination.

Uses structured logging via `createLogger` (disabled by default).

---

**Sources:** `src/app/components/service-worker/ServiceWorkerRegistration.tsx`, `@lib/utils/service-worker-cleanup`