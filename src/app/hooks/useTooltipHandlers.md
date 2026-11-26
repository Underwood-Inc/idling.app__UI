---
title: useTooltipHandlers
description: Pointer/keyboard handlers for link tooltip, modal, and fullscreen UI
---

# useTooltipHandlers

Wires DOM interaction for `LinkTooltip` (hover delay, modal, navigation).

## Input props

Requires refs and setters from `useTooltipState`, plus `updatePosition`, `fetchPreview`, `url`, `enableCtrlClick`.

## Returned handlers

`handleMouseEnter`, `handleMouseLeave`, `handleTooltipMouseEnter`, `handleTooltipMouseLeave`, `handleClick`, `handleModalClose`, `handleModalContentClick`, `handleFullscreenToggle`, `handleControlsToggle`.

## Desktop hover

- Skipped when `matchMedia('(hover: none) and (pointer: coarse)')` (mobile)
- **300ms** delay before `setShowTooltip(true)`, `updatePosition`, `fetchPreview`
- Leave uses **300ms** hide timeout; cancels if pointer re-enters tooltip

## `handleClick`

- **Mobile:** `preventDefault` — toggles tooltip open/closed (no navigation)
- **Desktop:** Ctrl/Cmd+click (if `enableCtrlClick`) → close tooltip, open modal
- **Else:** `window.open(url, '_blank', 'noopener,noreferrer')`

## Modal

`handleModalClose` removes `document.body` class `modal-open`.

## Side effects

Uses `hideTimeoutRef` / `isHoveringRef` / `shouldFetchRef` from parent; does not fetch directly except via `fetchPreview` callback.

---

**Sources:** `src/app/hooks/useTooltipHandlers.ts`