---
title: Chat Hub
description: React P2P chat UI with WebRTC signaling worker
---

# Chat Hub

**What this is:** Vite **React** app **`@strixun/chat-hub`** — browser UI for suite P2P chat (`@strixun/chat` package) with OTP login widgets. Signaling runs on **`strixun-chat-signaling`** Cloudflare Worker (WebRTC offer/answer exchange).

## Frontend entry

- **Package:** `strixun-stream-suite/apps/chat-hub/package.json`
- **Dev:** `vite`; `dev:all` runs UI + `pnpm --filter strixun-chat-signaling dev`
- **Deps:** `@strixun/chat`, `@strixun/auth-store`, `@strixun/otp-login`, `@strixun/shared-components`

## Signaling worker

Operator detail: [Chat Signaling API](/products/ensemble/chat-signaling) (`chat-api.idling.app`).

- **Package:** `strixun-stream-suite/serverless/chat-signaling/package.json` (v1.1.0)
- **Entry:** `worker.ts` → `dist/worker.js`; local port **8792**
- **Deps:** `@strixun/api-framework`, `zod`

## Failure modes

| Issue | Check |
| ----- | ----- |
| Rooms not connecting | Signaling worker running; browser ICE/firewall |
| Auth missing | OTP auth dev on 8787; `otp-login` React build in consumer `predev` |

Part of [Stream Suite](/products/stream-suite) ensemble.

---

**Sources (audited):** `strixun-stream-suite/apps/chat-hub/package.json`, `strixun-stream-suite/serverless/chat-signaling/package.json`, `strixun-stream-suite/serverless/chat-signaling/worker.ts`