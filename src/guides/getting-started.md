---
title: 'Getting started'
description: 'pnpm, Docker development, and documentation server on port 3001'
---

# Getting started

**In plain terms:** install dependencies with **pnpm**, run the app in **Docker** (team default), and optionally run the docs site on **port 3001**.

## Requirements

| Tool | Version |
| ---- | ------- |
| Node.js | **≥ 22** (`package.json` `engines`) |
| pnpm | **≥ 11** |
| Docker | For `dev:docker` workflows |

This project does **not** use Yarn as the package manager. Use `pnpm` for every script below.

## First-time setup (Windows)

```powershell
pnpm setup:windows
pnpm install
```

Create `.env.local` with Postgres and NextAuth values — see repo-root [`QUICK_START.md`](https://github.com/Underwood-Inc/idling.app__UI/blob/main/QUICK_START.md) for the full variable list. Generate a secret:

```powershell
pnpm gen:secret
```

## Run the application

```powershell
pnpm dev:docker:win
```

- **App:** http://localhost:3000  
- On Windows Docker, the docs container may be omitted; run docs locally when needed.

## Run documentation (Docusaurus)

```powershell
pnpm docs:dev
```

- **Docs:** http://localhost:3001 (not under `/docs` — `routeBasePath` is `/`)

## When things go wrong

| Symptom | Check |
| ------- | ----- |
| `engineStrict` failure | `node -v` ≥ 22, `pnpm -v` ≥ 11 |
| Database errors | `.env.local` matches Docker Postgres service |
| Stale co-located stub | Prefer [hub testing guide](/guides/testing) over `src/lib/testing.md` until stubs are regenerated |

## Related

- [Stack & tooling](/guides/stack)
- [Contributing](/guides/contributing)
- [Idling application features](/idling/index) — radio, PWA, tools, API map
- [API overview](/idling/api-overview) — real `/api/*` handlers vs OpenAPI

---

**Sources:** `package.json` (`engines`, `setup:windows`, `dev:docker:win`, `docs:dev`), repo-root `QUICK_START.md`