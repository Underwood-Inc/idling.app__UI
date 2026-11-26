---
title: Discord Defect Bot
description: Multi-product defect ticketing in Discord Forum channels
---

# Discord Defect Bot

**What this is:** Long-running **Node 24** service **`@shirecraft/discord-defect-bot`** — Discord.js bot that routes slash interactions into per-product Forum threads, SQLite ticket state, and catalog-driven defect forms. Supports Docker + PM2 deploys for ops teams tracking bugs across Shirecraft, Mappy, Stream Suite, and other registered products.

## Runtime entry

- **Package:** `apps/discord-defect-bot/package.json` (v1.1.2)
- **Main process:** `apps/discord-defect-bot/src/index.ts` — `discord.js` client, SQLite stores, `createInteractionRouter`
- **Deploy:** `docker compose up -d` or `pnpm start` / `start:pm2` after `pnpm build`
- **Register commands:** `pnpm register` (dist) or `register:dev` (tsx)

## Data and catalog

- SQLite path from `config.databasePath` (ticket, tag, status, prefix stores under `plugs/sqlite/`)
- Product forums validated via `validateForumChannels` and `defectFormCatalog`

## Failure modes

| Issue | Check |
| ----- | ----- |
| Slash commands missing | `pnpm register` against bot application ID |
| Forum product mismatch | `assertUsableForumProducts` logs; defect form catalog coverage audit on boot |

Not a public web product — ensemble doc for operator deployables beside game server plugins.

---

**Sources (audited):** `apps/discord-defect-bot/package.json`, `apps/discord-defect-bot/src/index.ts`