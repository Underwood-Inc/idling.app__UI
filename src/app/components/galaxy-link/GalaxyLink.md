---
title: GalaxyLink
description: Opens Galaxy app in overlay modal via InstantLink
---

# GalaxyLink

Client nav link that intercepts navigation and opens the Galaxy route in a global overlay modal with embedded iframe.

## Exports

- `GalaxyLink` — named export, no props

## Behavior

- `handleClick` prevents default, `openOverlay` with id `galaxy-modal`, type `modal`, component `GalaxyModalContent` (header + close, iframe `src={NAV_PATHS.GALAXY}`).
- Wrapped in `LinkTooltip` with `enableExtendedPreview`, `enableCtrlClick`, `isInsideParagraph`.
- `InstantLink` still sets `href`/`target="_blank"` for middle-click and SEO; label text is **Galaxy**.

---

**Sources:** `src/app/components/galaxy-link/GalaxyLink.tsx`, `src/app/components/galaxy-link/GalaxyLink.css`, `@lib/context/OverlayContext`, `src/lib/routes`, `src/app/components/ui/InstantLink`, `src/app/components/tooltip/LinkTooltip`