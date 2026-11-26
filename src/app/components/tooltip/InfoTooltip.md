---
title: InfoTooltip
description: String hover tooltip with viewport-aware positioning
---

# InfoTooltip

Lightweight hover tooltip for plain-text hints (same positioning ideas as link tooltips, without preview fetch).

## Props

| Prop | Default |
|------|---------|
| `content` | required string |
| `children` | trigger |
| `delay` | `300` ms |
| `disabled` | `false` |
| `isInsideParagraph` | `false` — adjusts wrapper element (`span` vs `div`) |

## Behavior

Shows after delay while hovering trigger; positions above/below and clamps to viewport; hides on leave with short grace timeout. Uses `LinkTooltip.css` class names.

---

**Sources:** `src/app/components/tooltip/InfoTooltip.tsx`, `src/app/components/tooltip/LinkTooltip.css`