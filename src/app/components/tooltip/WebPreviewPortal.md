---
title: WebPreviewPortal
description: Fixed iframe preview portal at explicit coordinates
---

# WebPreviewPortal

Low-level iframe preview floater (separate from `LinkTooltip` fetch/cache stack).

## Props

| Prop | Role |
|------|------|
| `url` | Assigned to iframe `src` when visible |
| `isVisible` | Gate render |
| `position` | `{ x, y }` pixel offset for portal box |

## Behavior

Client-only after `mounted`; sets loading flag until iframe load. Header shows truncated URL and close affordance (styling in `WebPreviewPortal.css`).

---

**Sources:** `src/app/components/tooltip/WebPreviewPortal.tsx`