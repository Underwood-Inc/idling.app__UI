---
title: Chat Signaling API
description: WebRTC signaling worker for Chat Hub P2P rooms
---

# Chat Signaling API

**What this is:** Cloudflare Worker **`strixun-chat-signaling`** — WebRTC offer/answer relay and room state in `CHAT_KV`. The browser UI lives in [Chat Hub](/products/ensemble/chat-hub) (`chat.idling.app`); this worker is the **API** host only.

## Worker entry

- **Package:** `strixun-stream-suite/serverless/chat-signaling/package.json` (v1.1.0)
- **Main:** `worker.ts` → `dist/worker.js`
- **Dev:** `wrangler dev --port 8792 --local --env development`
- **Production route:** `chat-api.idling.app/*` (`wrangler.toml` comments: frontend at `chat.idling.app`)

## Bindings

| Binding | Role |
| ------- | ---- |
| `CHAT_KV` | Signaling session and room metadata |
| `AUTH_SERVICE` | JWT validation against OTP auth JWKS |

## Split: UI vs API

| Surface | URL | Hub |
| ------- | --- | --- |
| Chat UI | `chat.idling.app` | [Chat Hub](/products/ensemble/chat-hub) |
| Signaling API | `chat-api.idling.app` | this page |

---

**Sources (audited):** `strixun-stream-suite/serverless/chat-signaling/package.json`, `strixun-stream-suite/serverless/chat-signaling/wrangler.toml`, `strixun-stream-suite/serverless/chat-signaling/worker.ts`