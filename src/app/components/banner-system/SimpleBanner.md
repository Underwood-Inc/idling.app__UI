---
title: SimpleBanner
description: Single dismissible alert, timeout, or rate-limit banner with timed progress
---

# SimpleBanner

Presentational client banner with type-driven styling and optional live countdown.

## Props

- `id: string`
- `type: 'alert' | 'timeout' | 'rate-limit'`
- `title`, `message: string`
- `dismissible?: boolean` — default `true`
- `onDismiss: () => void`
- `metadata?` — `reason`, `expiresAt`, `alertType`, `userId`
- `retryAfter?: number` — seconds (rate-limit)
- `createdAt?: number` — ms epoch for countdown anchor

## Behavior

- Entrance: `isVisible` false → true after 100ms (translate/opacity transition).
- When `retryAfter` set: 1s interval updates `timeLeft` and top progress bar; at 0 calls `handleDismiss`.
- Dismiss: hide then `onDismiss` after 300ms.

## Visual config

`useMemo` maps `type` and `metadata.alertType` (`warning`, `error`, `success`, `maintenance`, default info) to gradients, borders, and `SiteIconId` (`zap`, `clock`, triangles, etc.).

Rate-limit shows “Try again in {formatted time}” with pulsing dot.

## Accessibility

Dismiss control `aria-label="Dismiss notification"`.

## Exports

Named `SimpleBanner`.

---

**Sources:** `src/app/components/banner-system/SimpleBanner.tsx`