---
title: AmbientStarfieldProvider
description: React context that builds one responsive starfield on mount and resize
---

# AmbientStarfieldProvider

Provides a single `AmbientStarfield` instance for the full background and clipped horizon overlays.

## Props

`AmbientStarfieldProviderProps`:

- `children: ReactNode`

## Exports

- `AmbientStarfieldProvider`
- `useAmbientStarfield()` — returns context value; outside provider this is `EMPTY_STARFIELD` (empty shadows, no animated stars).

## Lifecycle

On mount, reads `window.innerWidth`, calls `getAmbientStarfieldCounts` and `createAmbientStarfield`, and stores the result in state. Listens to `resize` and only regenerates when the count key (`dust-medium-twinkle-cross-spark`) changes.

## Edge cases

- SSR / first paint: consumers see empty starfield until the client effect runs.
- No auth or HTTP; purely client-side random layout (non-deterministic per regeneration).

---

**Sources:** `src/app/components/ambient-background/AmbientStarfieldProvider.tsx`