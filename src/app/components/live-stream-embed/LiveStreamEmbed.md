---
title: LiveStreamEmbed
description: Dual-platform live stream player with auto platform pick
---

# LiveStreamEmbed

Client embed that polls live status and renders Twitch/YouTube iframes only when at least one channel is live.

## Exports

- `LiveStreamEmbed` — named export
- `LiveStreamEmbedProps` — interface

## Props (`LiveStreamEmbedProps`)

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `twitchChannel` | `string` | `'strixun'` | Twitch player + links |
| `youtubeChannel` | `string` | `'@strixun'` | YouTube embed handle |
| `defaultPlatform` | `'twitch' \| 'youtube'` | `'twitch'` | Initial selection |
| `checkInterval` | `number` | `60000` | Poll ms for `/api/streams/live-status` |

## Behavior

- Fetch includes `X-Background-Request: true` to avoid global loader.
- Auto-switch: prefer Twitch when both live; switch to the live platform when the current choice is offline.
- Returns `null` while loading or when neither stream is live.
- UI: platform toggle buttons (with viewer count on Twitch), external open link, 16:9 iframe player, channel links footer.

---

**Sources:** `src/app/components/live-stream-embed/LiveStreamEmbed.tsx`, `src/app/components/live-stream-embed/LiveStreamEmbed.css`