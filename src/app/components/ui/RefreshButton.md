---
title: RefreshButton
description: Icon button that runs an async refresh handler with spinner state
---

# RefreshButton

## Props

| Prop | Default |
|------|---------|
| `onRefresh` | required `() => Promise<void>` |
| `title` / `aria-label` | `'Refresh post'` |
| `disabled` | `false` |
| `className` | `''` |

## Behavior

Guards double-submit; `refresh-button--refreshing` while pending. Idle: Lucide `RefreshCw` via `LucideIcon`; loading: `ClipLoader` with `var(--brand-secondary)`.

---

**Sources:** `src/app/components/ui/RefreshButton.tsx`