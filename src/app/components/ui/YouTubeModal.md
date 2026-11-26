---
title: YouTubeModal
description: Modal shell with full-width YouTube embed and escape/backdrop close
---

# YouTubeModal

Overlay-friendly modal body (not the global `OverlayRenderer` wrapper itself).

## Props

| Prop | Default |
|------|---------|
| `url` | required |
| `title` | `'YouTube Video'` |
| `onClose` | backdrop click, Escape key, header close button |

## Markup

`youtube-modal` backdrop → header title + close SVG → `YouTubeEmbed` at width `F`. Registers document `keydown` for Escape when `onClose` is provided.

Typically opened via `useOverlay` from `URLPill` modal behavior.

---

**Sources:** `src/app/components/ui/YouTubeModal.tsx`, `src/app/components/ui/YouTubeEmbed.tsx`