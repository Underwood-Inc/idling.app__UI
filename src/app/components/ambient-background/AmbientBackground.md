---
title: AmbientBackground
description: Full-site decorative sky layer driven by shared starfield context
---

# AmbientBackground

Client component (`'use client'`) that renders the site-wide ambient sky behind page content.

## Behavior

- Calls `useAmbientStarfield()` and passes the result to `AmbientSkyEffectsLayer`.
- Root wrapper uses `AmbientBackground.module.css` class `ambient`, `aria-hidden="true"`, and `data-testid="ambient-background"`.

## Requirements

Must sit under `AmbientStarfieldProvider` (or `useAmbientStarfield` returns the empty starfield until the provider mounts and generates data).

## Exports

Named export `AmbientBackground` (also re-exported from `index.ts`).

---

**Sources:** `src/app/components/ambient-background/AmbientBackground.tsx`