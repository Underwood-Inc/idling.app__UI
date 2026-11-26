---
title: MentionTooltip
description: Fixed-position mention menu for author vs content filters
---

# MentionTooltip

Small action menu for `@mention` filter shortcuts.

## Props

| Prop | Role |
|------|------|
| `username` | Shown in header |
| `position` | `{ x, y }` fixed coordinates |
| `onFilterByAuthor` / `onFilterByContent` | Primary actions |
| `onClose` | Outside click + Escape |
| `onHover` / `onLeave` | Optional pointer bridge for hover chains |

## Behavior

`position: fixed` panel with filter buttons and `SiteIcon` affordances. Document listeners for mousedown outside and Escape.

---

**Sources:** `src/app/components/tooltip/MentionTooltip.tsx`