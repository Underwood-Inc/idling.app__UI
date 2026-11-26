---
title: useTooltipPosition
description: Viewport-aware tooltip coordinates from trigger and content rects
---

# useTooltipPosition

Positions floating tooltip content relative to trigger element.

## Signature

`useTooltipPosition(tooltipRef, tooltipContentRef)` — both `RefObject<HTMLElement | null>`.

## Return

`{ position: { top, left }, updatePosition }` — call `updatePosition` after show/layout (handlers use `setTimeout(..., 0)`).

## Algorithm

1. Prefer below trigger (`triggerRect.bottom + 8px`), horizontally centered on trigger
2. Flip above if insufficient space below and more space above
3. Clamp horizontal to viewport ± **8px** padding
4. Final vertical clamp: if still clipped, pick best of above/below or pin to viewport edge

Uses `getBoundingClientRect()` on both refs; no scroll offset math (fixed/absolute overlay assumption).

## Edge cases

No-op if either ref missing. Recomputed on each `updatePosition` call, not on scroll/resize unless caller re-invokes.

---

**Sources:** `src/app/hooks/useTooltipPosition.ts`