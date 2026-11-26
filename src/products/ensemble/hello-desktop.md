---
title: Hello Desktop
description: Tauri + Vite template with CLAD layout and Local Data Plane reference
---

# Hello Desktop

**What this is:** GitHub template desktop app **`hello-desktop`** (`apps/hello-desktop`) — Vite + TypeScript shell with **Tauri 2** primary path and legacy Electron `main.mjs`. Documents CLAD-tier folder layout and multi-window frameless chrome for greenfield desktop products.

## Runtime entry

- **Package:** `apps/hello-desktop/package.json` — template version `0.1.0`, Node ≥22, pnpm ≥10
- **Tauri:** `apps/hello-desktop/src-tauri/tauri.conf.json` — identifier `com.example.hello-desktop`, `frontendDist: ../dist`
- **Dev:** `pnpm dev` (Vite); Tauri `beforeDevCommand` hooks same

## Local Data Plane

Canonical LDP implementation lives under `apps/hello-desktop/packages/local-data-plane/` (ports, forge, adapters). **Overlane** Tantivy search crate depends on this path from `scs-telemetry-overlay/desktop/src-tauri/Cargo.toml`.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Tauri vs Electron mismatch | Active script target (`build:electron` in tauri `beforeBuildCommand`) |
| LDP tests failing in consumer | Bump LDP package version before embedding in downstream apps |

Template repo URL in package.json: `Underwood-Inc/hello-desktop`.

---

**Sources (audited):** `apps/hello-desktop/package.json`, `apps/hello-desktop/src-tauri/tauri.conf.json`