---
title: cache-manager
description: Service worker messaging, TTL policy, and full client cache cleanup
---

# cache-manager

Central client utility for cache age policy (max **12 hours**), service worker RPC, storage wipes, and avatar localStorage hygiene.

## Policy

- `MAX_CACHE_AGE` — 12h cap for all TTLs.
- `CACHE_TTLS` — `static`, `dynamic`, `api`, `images`, `pages` (each clamped to max age).

## Service worker

| API | Purpose |
| --- | ------- |
| `sendServiceWorkerMessage` | PostMessage + 10s timeout |
| `getCacheInfo` / `refreshCache` / `cleanupOldCaches` | SW-backed cache ops |
| `registerServiceWorker` | Registration helper |
| `isServiceWorkerActive` | Controller present |

## Cleanup

- `clearAllCaches`, `clearAllBrowserStorage`, `performCompleteCleanup` — coordinated purge (preserves radio IndexedDB via `deleteNonPreservedIndexedDatabases`).
- `cleanupServiceWorkers` — unregister SWs.
- `clearRouteFilters` — route filter localStorage key.

## Maintenance

- `shouldPerformDailyRefresh` / `markDailyRefreshCompleted` — daily refresh gate.
- `formatCacheAge`, `isCacheExpired` — UI helpers.
- `clearOldAvatarCache`, `getAvatarCacheSize`, `isAvatarCacheNearQuota` — avatar blob cache.

---

**Sources:** `src/lib/utils/cache-manager.ts`