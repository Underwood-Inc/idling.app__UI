---
title: FooterBadge
description: Fixed-position footer chip that expands when the pointer is nearby
---

# FooterBadge

Dual-layer fixed `button` (background + clipped front) that expands when the cursor is within `hoverDistance` pixels of the badge center.

## Props (`FooterBadgeProps`)

| Prop | Default | Notes |
|------|---------|-------|
| `text` | required | Label; also `aria-label` / `title` |
| `icon` | `'+'` | Collapsed glyph |
| `theme` | `'primary'` | `primary` \| `secondary` \| `success` \| `warning` \| `danger` |
| `rightOffset` / `bottomOffset` | `20` / `4` | Inline `style` position |
| `hoverDistance` | `80` | Expansion radius in px |
| `disabled` | `false` | Skips hover tracking and click |
| `onClick` | — | Fires when not disabled |

## Behavior

`mousemove` on `document` tracks distance from badge center; `footer-badge--expanded` toggles CSS. Renders paired buttons so the badge can sit flush with the site footer chrome.

---

**Sources:** `src/app/components/ui/FooterBadge.tsx`, `src/app/components/ui/FooterBadge.css`