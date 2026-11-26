---
title: timeFormatting
description: Human-readable duration strings for rate limits and quota UI
---

# timeFormatting

Formats second counts for API error copy and quota reset messaging.

## API

| Function | Style |
| -------- | ----- |
| `formatRetryAfter(seconds)` | Verbose: `42 seconds`, `3 minutes`, `2 hours`, `1 day` (ceil, pluralized) |
| `formatTimeRemaining(seconds)` | Compact: `45s`, `12m`, `2h 15m`, `1d 3h` |
| `formatQuotaResetTime(resetTimestamp)` | Millisecond epoch → `now` or `formatRetryAfter` until reset |

Thresholds: under 60s, under 1h, under 24h, then days.

---

**Sources:** `src/lib/utils/timeFormatting.ts`