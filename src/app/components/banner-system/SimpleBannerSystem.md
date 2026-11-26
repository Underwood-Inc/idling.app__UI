---
title: SimpleBannerSystem
description: Banner list from API wrapper payloads and sessionStorage rate limits
---

# SimpleBannerSystem

Client stack that derives banners from enriched API responses instead of dedicated polling endpoints.

## Default export

`SimpleBannerSystem` — renders sorted banners (`priority` desc) in a `zIndex: 1000` container; each maps to `SimpleBanner` with `dismissBanner(id)`.

## Hook: `useSimpleBanners`

Returns `{ banners, processWrapperData, dismissBanner }`.

### `processWrapperData(responseData)`

Builds `BannerData[]` from:

1. **`activeAlertsInfo.alerts`** — ids `alert-{id}`; skips ids in `localStorage` key `dismissed-alerts`.
2. **`timeoutInfo`** when `is_timed_out` and `expires_at` — fixed id `timeout-banner`, priority 90.
3. **`sessionStorage` `rate-limit-info`** — JSON with `endpoint`, `retryAfter` (default 60).

Merges with existing banners, drops expired rate-limits by elapsed time vs `retryAfter`, dedupes by id, updates only when JSON signature changes.

### Dismiss

Adds id to `dismissed-alerts` in localStorage; removes from state. `cleanupDismissedAlerts` on mount clears stored dismiss list (no timestamps yet).

## Types

Exported `BannerData` — mirrors alert/timeout/rate-limit fields used by `SimpleBanner`.

## Auth

`useSession()` is imported in hook (status available for future gating; banner source is primarily wrapper/sessionStorage).

## `forceLog`

Only forwards `warn`/`error` to `window.__originalConsole` when present (debug/info suppressed).

## Integration

Callers (typically API client wrappers) must invoke `processWrapperData` with response JSON containing wrapper fields.

---

**Sources:** `src/app/components/banner-system/SimpleBannerSystem.tsx`