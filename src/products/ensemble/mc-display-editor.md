---
title: MC Display Editor
description: Vite + Three.js editor for block_display / item_display compositions and summon export
---

# MC Display Editor

**What this is:** standalone web app (**v0.1.0**, `package.json`) for authoring **world-placed** Minecraft display entities (`block_display`, `item_display`). Exports composition JSON and copy-paste summon lines for vanilla Java clients — not Blockbench inventory models.

## Runtime entry

- **HTML:** `index.html` → `<script type="module" src="/src/main.ts">`
- **Bootstrap:** `src/main.ts` mounts `EditorApp` on `#app` (`src/editor.ts`)
- **Viewport:** `src/viewport.ts` — Three.js scene, orbit/transform controls, brush placement
- **Dev server:** `vite.config.ts` — port **5174**, `base: './'`

## Scripts (`package.json`)

| Script | Role |
| ------ | ---- |
| `dev` | Vite dev + HMR |
| `build` | `tsc && vite build` → `dist/` |
| `preview` | Serve production build |
| `check` | `tsc --noEmit` |

## Editor behavior (implementation)

- **Tools:** Select (V), Brush (B), Erase (X), Eyedropper (I) — `src/lib/tools.ts`, hotkeys in `src/lib/hotkeys.ts`
- **Snap / brush grid:** `src/lib/snap.ts`, `src/lib/brush.ts`, cell steps through 1/16–1 block
- **Export:** `src/export.ts` — canonical JSON + summon script with preview tag `display_editor.preview`
- **Seed library:** `src/rituals-models.ts` — 12 Rituals totem compositions (6 tiers × tall/short)
- **History:** `src/lib/history.ts` (undo/redo per stroke)

Geometry anchor matches vanilla: `block_display` cubes span **(0,0,0)→(1,1,1)** before transform (`README.md`).

## Operator troubleshooting

| Symptom | Check |
| ------- | ----- |
| Preview mismatch in-game | Corner-origin math in `viewport.ts` / export transforms |
| Cleanup summon entities | `/kill @e[type=minecraft:block_display,tag=display_editor.preview,distance=..64]` |
| Offline textures | `src/lib/textures.ts` — GitHub 1.21.4 asset mirror fallback colors |

## Ensemble links

Rituals placed totems: [Showcase](/products/showcase/rituals). Wire exports into datapack sync separately — repo stays standalone.

---

**Sources (audited):** `mc-display-editor/package.json`, `mc-display-editor/index.html`, `mc-display-editor/vite.config.ts`, `mc-display-editor/src/main.ts`, `mc-display-editor/src/editor.ts`, `mc-display-editor/README.md`