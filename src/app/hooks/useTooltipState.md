---
title: useTooltipState
description: Shared React state bundle for link tooltip + modal + preview fetch flags
---

# useTooltipState

Central state container for link tooltip components (`LinkTooltip`, etc.).

## Return shape

**Booleans + setters:** `showTooltip`, `showModal`, `isFullscreen`, `showControls`, `mounted`.

**Preview:** `tooltipData` (`any`), `loading`, `error`, `timeAgo` (+ setters).

**Refs:**

| Ref | Typical use |
|-----|-------------|
| `hideTimeoutRef` | Debounced tooltip hide |
| `timerRef` | Relative time refresh interval |
| `isHoveringRef` | Pointer still over trigger/tooltip |
| `shouldFetchRef` | Gate refetch after hide |

No effects in this module — consumers own fetch/timer logic.

## Design

Single hook avoids prop drilling十几个 setters into `useTooltipHandlers` and preview effects.

---

**Sources:** `src/app/hooks/useTooltipState.ts`