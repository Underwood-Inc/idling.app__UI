---
title: ImageEmbed
description: Inline image or video embed with edit-mode size and mode controls
---

# ImageEmbed

Renders lazy-loaded images or looped inline video (by URL extension) with optional author controls mirroring YouTube pill UX.

## Props

| Prop | Default | Notes |
|------|---------|-------|
| `src` | required | HTTP(S) URL or `data:temp-image;…` (decoded to inner data URL) |
| `width` | `'medium'` | `small` \| `medium` \| `large` \| `full` → `image-embed--{s,m,l,f}` |
| `mode` | `'embed'` | `embed` \| `link` (toggle UI in edit mode) |
| `isEditMode` | — | Shows remove / mode / width toolbars |
| `isTemporary` | `false` | Adds temp container class |
| `onRemove`, `onWidthChange`, `onModeChange` | — | Edit callbacks |

## Behavior

Tracks load/error state; failed loads show `SiteIcon` error panel with raw URL. Video paths use muted, looping `<video controls>`. Shares stylesheet with URL pills (`URLPill.css`).

---

**Sources:** `src/app/components/ui/ImageEmbed.tsx`, `src/app/components/ui/URLPill.css`