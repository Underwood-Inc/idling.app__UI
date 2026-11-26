---
title: useRadioStationPanelHeight
description: Resizable radio station list panel height
---

# useRadioStationPanelHeight

Loads `panelHeightPx` from preferences, exposes vertical resize via `beginResize(clientY)`, `resetHeight`, `isResizing`, `isPanelHeightResolved`.

`enabled` gates layout effects. Uses `RADIO_STATION_PANEL_HEIGHT_RANGE_PX` clamps.

---

**Sources:** `src/lib/hooks/useRadioStationPanelHeight.ts`, `@widgets/radio-player/radioStationPanelHeightPreferences`