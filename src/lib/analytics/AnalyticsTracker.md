---
title: AnalyticsTracker
description: Client-side sessions, page views, clicks, errors, rage clicks
---

# AnalyticsTracker

Balanced analytics (no keystroke/hover surveillance). Batches events to a configurable HTTP `endpoint`.

## `AnalyticsConfig`

Toggles collection for clicks, page views, performance, errors, rage clicks; `batchSize`, `flushInterval`, `excludeSelectors`, `debug`, `autoInit`.

## Data types

`SessionData`, page view / click / error payloads defined in source — session token generated in-module.

Singleton-style init from app shell when enabled for production.

---

**Sources:** `src/lib/analytics/AnalyticsTracker.ts`