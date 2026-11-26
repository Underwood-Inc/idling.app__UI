---
title: URLPill
description: Renders structured URL tokens as embed, link, or modal media
---

# URLPill

Central router for post content URL pills. Uses `getMediaType`, `getURLPillType`, and `shouldEmbedURL` from `@lib/config/url-pills` and `@lib/config/media-domains`.

## Props (`URLPillProps`)

| Prop | Role |
|------|------|
| `url` | Required href or `data:temp-image;…` |
| `behavior` | `embed` \| `link` \| `modal` (YouTube modal uses `OverlayContext`) |
| `width` | `small` \| `medium` \| `large` \| `full` for embeds |
| `isEditMode` | Surfaces mode/width toggle chrome |
| `onWidthChange`, `onModeChange`, `onRemove` | Authoring callbacks |

## Render paths

- Invalid `url` → `url-pill--invalid` span.
- Temp image → delegates to `ImageEmbed`.
- YouTube + `modal` → link pill opening `YouTubeModal` overlay.
- Embed branch → `YouTubeEmbed`, `ImageEmbed`, or unknown-type link with edit toggles.
- Default link pill with domain label and behavior icon.

`onBehaviorChange` is accepted on props type for parent edit flows (see source call sites).

---

**Sources:** `src/app/components/ui/URLPill.tsx`, `@lib/config/url-pills`, `src/app/components/ui/YouTubeEmbed.tsx`, `src/app/components/ui/ImageEmbed.tsx`