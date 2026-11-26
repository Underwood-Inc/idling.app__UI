---
title: TooltipContent
description: Loaded state UI for link preview tooltips
---

# TooltipContent

Presentational panel for `LinkTooltip` fetch lifecycle.

## Props (`TooltipContentProps`)

| Prop | Role |
|------|------|
| `loading`, `error`, `tooltipData` | Fetch state |
| `url` | Canonical href for links |
| `enableExtendedPreview` | Larger preview layout |
| `isCached`, `lastUpdated`, `cacheStats` | Cache readout |
| `onRefresh`, `onClearCache` | Cache controls |
| `onClick` | Primary navigate/open handler |

## States

- Loading spinner (“Loading preview…”).
- Error / empty data messages.
- Success: title, description, image, domain, `InstantLink` CTA; optional cache footer with `TimestampWithTooltip`.

Mobile layout branches via `matchMedia (hover: none)`.

---

**Sources:** `src/app/components/tooltip/TooltipContent.tsx`, `src/app/components/ui/InstantLink.tsx`