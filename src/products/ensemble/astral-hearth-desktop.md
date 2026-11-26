---
title: Astral Hearth Desktop
description: Tauri 2 desktop shell for the Astral Hearth Vite client
---

# Astral Hearth Desktop

**What this is:** **`apps/astral-hearth-desktop`** — Tauri **2** wrapper around the Astral Hearth Vite frontend (client-only phase 1). Distinct from the full-stack [Astral Hearth](/products/ensemble/astral-hearth) `typescript-version` package with Express + Socket.IO backend.

## Desktop entry

- **Package:** `apps/astral-hearth-desktop/package.json` (v0.1.0)
- **Tauri config:** `apps/astral-hearth-desktop/src-tauri/tauri.conf.json` — `productName` **Astral Hearth**, identifier `app.astralhearth.desktop`
- **Dev:** `pnpm tauri:dev` (Vite dev URL `http://localhost:1420`)
- **Build:** `pnpm tauri:dist:win` (NSIS bundle) or `tauri build`

## Split: server vs desktop

| Artifact | Repo path | Hub |
| -------- | --------- | --- |
| 3D globe + alert backend | `astral-hearth/typescript-version` | [Astral Hearth](/products/ensemble/astral-hearth) |
| Desktop shell | `apps/astral-hearth-desktop` | this page |

---

**Sources (audited):** `apps/astral-hearth-desktop/package.json`, `apps/astral-hearth-desktop/src-tauri/tauri.conf.json`