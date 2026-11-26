---
title: Game API
description: Cloudflare Worker for idle-game state and JWT-backed game endpoints
---

# Game API

**What this is:** Cloudflare Worker **`strixun-game-api`** — idle-game persistence and API routes in `GAME_KV`, authenticated with suite OTP JWTs (cookie-based encryption pattern matches customer-api).

## Worker entry

- **Package:** `strixun-stream-suite/serverless/game-api/package.json` (v1.0.0)
- **Main:** `worker.ts` (v2.2.0 migration architecture) → `dist/worker.js`
- **Dev:** `wrangler dev --port 8794 --local --env development`
- **Production route:** `game.idling.app/*`

## Bindings

| Binding | Role |
| ------- | ---- |
| `GAME_KV` | Game state and progression blobs |
| `AUTH_SERVICE` | JWKS from `otp-auth-service` |

## Failure modes

| Issue | Check |
| ----- | ----- |
| 401 on protected routes | `auth_token` HttpOnly cookie from [Auth Service](/products/showcase/auth-service) |
| CORS from a new subdomain | `ALLOWED_ORIGINS` secret / `wrangler.toml` |

Embeddable client library: [Dice Board Game](/products/ensemble/dice-board-game) (Mods Hub admin import). Part of [Stream Suite](/products/stream-suite) operator surface (idle overlay widgets in root Svelte app reference game API consumers).

---

**Sources (audited):** `strixun-stream-suite/serverless/game-api/package.json`, `strixun-stream-suite/serverless/game-api/worker.ts`, `strixun-stream-suite/serverless/game-api/wrangler.toml`