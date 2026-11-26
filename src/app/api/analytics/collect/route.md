---
title: POST /api/analytics/collect
description: Ingest batched or single analytics events into Postgres
---

# POST /api/analytics/collect

Client ingestion for `AnalyticsTracker` — sessions, page views, clicks, etc. **`runtime: nodejs`**.

## Handler

`POST` via `withUniversalEnhancements(postHandler)`.

## Auth

Optional session: `auth()` supplies `userId` when logged in; anonymous events still accepted.

## Body modes

1. **Batched:** `{ events: [...] }` validated by `BatchedAnalyticsRequestSchema` — each event passed to `processEvent` with client IP (`getClientIpAddress`), user-agent, optional user id.
2. **Single event:** non-batch shape handled in the same handler (see `processEvent` switch in source).

Zod schemas at top of file (`SessionDataSchema`, `PageViewSchema`, …) define allowed payload fields.

## Storage

Writes via `sql` and helper functions in the same route module (large file ~1000 lines) — dashboard reads aggregated tables.

---

**Sources:** `src/app/api/analytics/collect/route.ts`, `src/lib/analytics/AnalyticsTracker.ts` (caller)