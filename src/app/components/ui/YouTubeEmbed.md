---
title: YouTubeEmbed
description: Lazy YouTube iframe embed with width presets
---

# YouTubeEmbed

## Props

| Prop | Default |
|------|---------|
| `url` | required |
| `width` | `'F'` → `S` \| `M` \| `L` \| `F` CSS classes |
| `title` | `'YouTube video'` |
| `className` | `''` |

## Behavior

`extractVideoId` supports watch, youtu.be, embed, and `/v/` patterns. `IntersectionObserver` (`rootMargin: 100px`) defers iframe until near viewport; placeholder shows until load. Embed query: `rel=0&showinfo=0&modestbranding=1`. Invalid URL → error panel with `SiteIcon` TV glyph.

---

**Sources:** `src/app/components/ui/YouTubeEmbed.tsx`