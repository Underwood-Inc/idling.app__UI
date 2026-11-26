---
title: useRadioDockWidth
description: Persisted horizontal resize for radio dock
---

# useRadioDockWidth

Returns `UseRadioDockWidthResult`: `dockWidthPx`, `isResizing`, `beginResize(clientX)`, `resetWidth()`.

Loads initial width via `loadRadioDockWidth()` from `@widgets/radio-player/radioDockWidthPreferences`. Pointer drag clamps with `clampRadioDockWidth` / `resolveRadioDockWidthMax`; persists on pointer up with `saveRadioDockWidth`.

Falls back to measuring `[data-testid="radio-player-bar"]` width when no stored value.

---

**Sources:** `src/lib/hooks/useRadioDockWidth.ts`