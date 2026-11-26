---
title: Overlane
description: Tauri desktop app for ETS2/ATS telemetry, archive search, and OBS overlays
---

# Overlane

**What this is:** Windows **Tauri 2** desktop shell (`com.strixun.overlane`, version from `tauri.conf.json` / `Cargo.toml`) for Euro Truck Simulator 2 and American Truck Simulator — live telemetry console, searchable drive archive, dashboard charts, hybrid hot/cold local storage, and OBS browser-source overlays. No cloud account required.

## Runtime entry

- **Rust lib:** `overlane_desktop_lib` — `desktop/src-tauri/src/lib.rs` → `run()` registers shell, dialog, opener plugins and Tauri commands (sidecar, Tantivy index, file export, audio).
- **Binary:** `desktop/src-tauri/src/main.rs` calls `overlane_desktop_lib::run()`.
- **Frontend:** Vite app in `scs-telemetry-overlay/desktop/` (`frontendDist` → `../dist` in `tauri.conf.json`).
- **Search:** `ldp_tantivy_search` crate path into `apps/hello-desktop/packages/local-data-plane` (shared LDP Tantivy adapter).

## Product surfaces (source)

- Tray + frameless main window (`decorations: false` in `tauri.conf.json`).
- Local Data Plane archive reads — SQL/DuckDB isolation per Overlane ADRs; hot/cold tiers in overlay Go/TS packages under `scs-telemetry-overlay`.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Archive search empty | Tantivy index commands in `lib.rs`; LDP path configuration |
| Overlay not updating | OBS browser source URL; sidecar listen config |
| Game not detected | Telemetry bridge / plugin handshake in overlay packages |

Live URL: `https://short.army/overlane` (marketing card in `projectShowcaseProjects.ts`).

---

**Sources (audited):** `scs-telemetry-overlay/desktop/src-tauri/tauri.conf.json`, `scs-telemetry-overlay/desktop/src-tauri/Cargo.toml`, `scs-telemetry-overlay/desktop/src-tauri/src/lib.rs`, `scs-telemetry-overlay/desktop/src-tauri/src/main.rs`