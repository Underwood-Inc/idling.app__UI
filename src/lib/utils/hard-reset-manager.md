---
title: hard-reset-manager
description: Version-gated full client data wipe for deploy migrations
---

# hard-reset-manager

When `resetVersion` changes (or `forceReset`), clears service workers, caches, storage, cookies, and non-preserved IndexedDB so the app behaves like a first visit. Radio player data can be snapshotted/restored via `radioPlayerPersistence`.

## Types

- **`HardResetConfig`** — `resetVersion`, optional `forceReset`, `resetReason`, `showNotification`.
- **`HardResetResult`** — Whether reset ran, version drift, per-surface clear counts, `errors[]`.

## API

| Function | Role |
| -------- | ---- |
| `isHardResetNeeded(config)` | Compare stored `app-last-reset-version` to current app version |
| `performHardReset(config)` | Execute wipe + persist new version metadata |
| `checkAndPerformHardReset(config)` | Gate + perform if needed (typical app bootstrap) |
| `triggerManualHardReset(reason?)` | User/admin initiated reset |
| `getResetStats()` | Read reset count, timestamps, first-visit flag |

Version resolution: `meta[name=app-version]`, `window.__APP_VERSION__`, or timestamp fallback.

---

**Sources:** `src/lib/utils/hard-reset-manager.ts`