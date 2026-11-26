---
title: TimestampWithTooltip
description: Live relative time label with timezone breakdown tooltip
---

# TimestampWithTooltip

Shows relative time (or abbreviated footer form) on the trigger; rich breakdown in `InteractiveTooltip`.

## Props

| Prop | Default |
|------|---------|
| `date` | `Date` \| ISO string \| `null` |
| `abbreviated` | `false` → `2d` style vs `2 days ago` |
| `showSeconds` | reserved in API |
| `updateInterval` | `60000` (relative tick uses 1s interval internally) |

## Tooltip content

- Multi-unit relative string (“Exact Time”).
- UTC `yyyy-MM-dd HH:mm:ss` via `date-fns-tz`.
- Local zone from `Intl.DateTimeFormat().resolvedOptions().timeZone`.

Null → “Unknown time”; invalid → “Invalid time” with console error.

---

**Sources:** `src/app/components/ui/TimestampWithTooltip.tsx`, `src/app/components/tooltip/InteractiveTooltip.tsx`