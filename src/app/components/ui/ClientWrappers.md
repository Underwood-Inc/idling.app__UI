---
title: ClientWrappers
description: Thin client mounts for ambient background and overlay renderer in server layouts
---

# ClientWrappers

Two zero-prop wrappers so server components can pull in client-only chrome without marking parent trees `'use client'`.

## Exports

| Export | Renders |
|--------|---------|
| `AmbientBackgroundWrapper` | `AmbientBackground` |
| `OverlayRendererWrapper` | `OverlayRenderer` |

## Usage

Import named wrappers from the site layout or shell and render once near the document root alongside `OverlayProvider` and `#overlay-portal`.

---

**Sources:** `src/app/components/ui/ClientWrappers.tsx`, `src/app/components/ambient-background/AmbientBackground.tsx`, `src/app/components/ui/OverlayRenderer.tsx`