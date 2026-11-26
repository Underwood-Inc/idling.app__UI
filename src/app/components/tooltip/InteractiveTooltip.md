---
title: InteractiveTooltip
description: Portal tooltip for rich ReactNode content with hover, click, or controlled modes
---

# InteractiveTooltip

General-purpose tooltip used by timestamps and in-content hints.

## Props (`InteractiveTooltipProps`)

| Prop | Notes |
|------|-------|
| `content` | `ReactNode` panel |
| `delay` | default `300` |
| `triggerOnClick` / `triggerOnRightClick` | Non-hover open paths |
| `show` | Controlled visibility |
| `onShow` / `onClose` | Lifecycle callbacks |
| `isInsideParagraph` | `span` wrapper when true |
| `className` | Wrapper modifier |

## Behavior

Renders panel via `createPortal` to `document.body`; tracks anchor on scroll/resize. On coarse pointers (`hover: none`), favors click/tap patterns. Supports programmatic `closeTooltip` when uncontrolled.

---

**Sources:** `src/app/components/tooltip/InteractiveTooltip.tsx`