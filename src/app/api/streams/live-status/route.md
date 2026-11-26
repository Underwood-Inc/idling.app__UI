---
title: GET /api/streams/live-status
description: Twitch and YouTube live flags without exposing API keys to the browser
---

# GET /api/streams/live-status

Aggregates **whether Twitch and YouTube channels are live**, using server-side credentials so the marketing site does not ship API keys.

## Handler

- **Dynamic:** `force-dynamic`
- **Method:** `GET` (plain `export async function GET`, no rate-limit wrapper in this file)

## Query

| Param | Default | Purpose |
| ----- | ------- | ------- |
| `twitch` | `strixun` | Twitch login to query Helix `streams` |
| `youtube` | `@strixun` | Handle passed to YouTube Data API search |

## Response shape

`StreamLiveStatusResponse`: `{ twitch: { isLive, title?, viewers? }, youtube: { isLive, title?, viewers? } }` — both default `isLive: false`.

## Env gates

- **Twitch:** only probes when `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are set (client credentials → Helix streams).
- **YouTube:** only when `YOUTUBE_API_KEY` is set (resolve channel, then `eventType=live` search).

External API errors are logged; partial results still return `200` when the outer try succeeds. Outer failure → `500` with `{ error: 'Failed to check stream status', twitch, youtube }`.

---

**Sources:** `src/app/api/streams/live-status/route.ts`