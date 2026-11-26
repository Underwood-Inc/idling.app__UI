---
title: Cloudflare Edge (R2 ops)
description: Wrangler-only repo for mappymaps R2 bucket setup and operator debugging
---

# Cloudflare Edge (R2 ops)

**What this is:** Sibling repo `cloudflare-edge` — **`@underwood/cloudflare-edge`**, a **Wrangler CLI toolkit** for the **`mappymaps`** R2 bucket. There is **no Worker** in this tree; public map packs are objects behind the custom domain **`https://maps.short.army`**. Production uploads for packs **≥ 2 GiB** run in **GitHub Actions** (`mappy-public` / `mappy-internal` publish workflows), not from local machines.

Cross-link: [Mappy Maps CDN](/products/ensemble/mappy-maps-cdn) (catalog + when `packUrl` points at R2).

## Package scripts

**File:** `cloudflare-edge/package.json`

| Script | Purpose |
| ------ | ------- |
| `whoami` | `wrangler whoami` — account verification |
| `r2:list` | `wrangler r2 bucket list` |
| `r2:create` | `wrangler r2 bucket create mappymaps` (bootstrap) |

**Dev dependency:** `wrangler` ^4.14.0 (operators use `pnpm exec wrangler` for commands beyond the npm scripts).

## Bucket config

- **Wrangler stub:** `cloudflare-edge/buckets/mappymaps/wrangler.jsonc` — bucket name `mappymaps`, `compatibility_date` 2025-03-01, Cloudflare account binding (no routes).
- **Operator doc:** `cloudflare-edge/buckets/mappymaps/README.md` — `MAPPY_OFFICIAL_R2_PUBLIC_BASE`, custom domain attach (`wrangler r2 bucket domain add`), dev-url disable, large-object `object put` examples.
- **Key prefix:** `official-maps/{worldId}.mappymap`

## CI secrets (mappy repos)

From `cloudflare-edge/README.md` — GitHub secrets on mappy publish workflows:

| Secret | Role |
| ------ | ---- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account |
| `MAPPY_OFFICIAL_R2_PUBLIC_BASE` | Public base (**no** trailing slash); canonical `https://maps.short.army` |
| `MAPPY_R2_ACCESS_KEY_ID` / `MAPPY_R2_SECRET_ACCESS_KEY` | S3-compatible R2 token for multipart upload |

After upload, CI verifies **S3 HeadObject** and anonymous **HTTP HEAD** on the public URL (`200` + matching `Content-Length`). Catalog `packUrl` is updated in `official-maps-index`; clients read `catalog.json` only (no Mappy app release required for URL changes).

## Local use (debug only)

```text
cd cloudflare-edge
pnpm install --ignore-workspace
pnpm exec wrangler whoami
pnpm exec wrangler r2 bucket list
```

Do **not** use local upload for production signed packs; signing secrets live in CI.

## Failure modes

| Symptom | Check |
| ------- | ----- |
| CI HEAD 401/403 on pack URL | `MAPPY_OFFICIAL_R2_PUBLIC_BASE` still pointing at disabled `*.r2.dev` |
| Wrangler put fails on huge file | Use S3 multipart in CI; single `object put` capped (~300 MiB CLI guidance) |
| Wrong pack in client | `catalog.json` `packUrl` vs object key under `official-maps/` |

---

**Sources (audited):** `cloudflare-edge/package.json`, `cloudflare-edge/README.md`, `cloudflare-edge/buckets/mappymaps/wrangler.jsonc`, `cloudflare-edge/buckets/mappymaps/README.md`