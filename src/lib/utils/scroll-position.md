---
title: scroll-position
description: localStorage-backed scroll restoration for list and thread navigation
---

# scroll-position

Client utilities that remember scroll Y (and list context) when moving between paginated feeds and detail pages.

## `ScrollPositionData`

Stores `scrollY`, `timestamp`, `pathname`, optional `searchParams`, pagination (`currentPage`, `infiniteMode`, `totalPages`), `filters`, and `targetSubmissionId`.

## Storage

- Key: `app-scroll-positions` in `localStorage`
- Max entries: 10 (newest kept)
- TTL: 30 minutes per entry

## API

| Function | Behavior |
| -------- | -------- |
| `storeScrollPosition(referrerKey, extra?, customScrollY?)` | Save or replace entry |
| `getStoredScrollPosition(referrerKey)` | Read if not expired |
| `restoreScrollPosition(referrerKey, { smooth?, offset? })` | Scroll window; returns success |
| `generateScrollKey(basePath, { page, filters, searchParams })` | Stable key for list state |
| `clearScrollPositions()` / `clearScrollPosition(key)` | Remove all or one |
| `updateScrollPosition` / `storeOrUpdateScrollPosition` | Refresh Y on same key |

No-ops when `window` is undefined (SSR). Failures log via `createLogger` (`module: scroll-position`).

---

**Sources:** `src/lib/utils/scroll-position.ts`