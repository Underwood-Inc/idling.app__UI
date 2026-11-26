---
title: RadioPlayerBar
description: Client dock for station playback, search, favorites, and visualizers
category: component
---

# RadioPlayerBar

**Role:** primary **client** surface for the idling radio product. Renders the bottom (or fullscreen) player chrome: transport controls, station list, genre and human-friendly search, favorite ordering, equalizer / spectrum / WebGL visualizer panels, and locale-aware labels via `useRadioCopy`.

## Dependencies (from implementation)

| Area | Modules |
| ---- | ------- |
| Player state | `@lib/context/RadioPlayerContext` |
| PWA detection | `@lib/radio-pwa/isStandalonePwa` |
| Visualizer mode | `@lib/context/VisualizerModeContext` |
| Layout metrics | `useRadioDockLayoutMetrics`, `useRadioDockInlineVisualizer`, `useRadioMetaWidth`, `useRadioStationPanelHeight` |
| Media Session | `useRadioMediaSession` |
| Favorites | `useRadioStationFavorites` + `radioStationFavorites.ts` helpers |
| Station data | `@widgets/radio-player/radioStationCatalog`, `radioStationBrowse`, `radioStationNavigation` |
| Visualizer presets | `barVisualizerPresets`, `webglVisualizerPresets`, `radioFullscreenVisualizerDisplay` |
| Copy / i18n | `useRadioCopy` → `idlingRadioI18n` + typesafe-i18n |
| Search UX | `HumanFriendlySearchHighlight`, `parseHumanFriendlySearchQuery` |

## Behavior highlights

- Lists stations from widget catalog; filters by genre, favorites, and parsed search query.
- Uses **availability probe** results (from `/api/radio/stations`) via browse helpers — unreachable stations can be counted and filtered.
- Supports **adjacent station** navigation (`resolveAdjacentRadioStation`) and favorite-recency sorting.
- Bar visualizer preferences include dock opacity, scope smoothing, fullscreen spectrum height ratio (see `barVisualizerPreferences.ts`).
- When `isStandalonePwa()`, layout branches for radio-PWA shell (see `radio-pwa` components).

## Props

Default export is a **no-prop** client component; all state comes from React context and hooks above.

## Related docs

- [Radio feature guide](/idling/radio)
- [PWA](/idling/pwa)

---

**Sources:** `src/app/components/radio-player/RadioPlayerBar.tsx`, `src/app/components/radio-player/useRadioCopy.ts`