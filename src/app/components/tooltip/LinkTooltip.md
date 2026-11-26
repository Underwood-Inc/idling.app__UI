---
title: LinkTooltip
description: URL hover preview with cache, extended preview, and optional ctrl-click modal
---

# LinkTooltip

Wraps a link trigger; fetches Open Graph–style preview data through tooltip hooks and renders `TooltipContent` in a portal.

## Props

| Prop | Default |
|------|---------|
| `url` | required |
| `enableExtendedPreview` | `false` |
| `enableCtrlClick` | `false` — enables `TooltipModal` iframe path |
| `cacheDuration` | passed to `useTooltipCache` |
| `isInsideParagraph` | layout wrapper |
| `className` | on trigger |

## Hooks composed

`useTooltipState`, `useTooltipCache`, `useTooltipPosition`, `useTooltipHandlers`; respects `useSession` for authenticated preview endpoints.

## Modal path

When `enableCtrlClick`, `TooltipModal` portals a controllable iframe preview with fullscreen and control chrome.

---

**Sources:** `src/app/components/tooltip/LinkTooltip.tsx`, `src/app/components/tooltip/TooltipContent.tsx`, `src/app/hooks/useTooltipCache.ts`