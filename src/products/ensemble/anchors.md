---
title: Anchors
description: Lock inventory slots against autosort, shift-click, and hopper drain
---

# Anchors

**What this is:** **Paper** plugin (`api-version: 26.3`, `load: POSTWORLD`) that pins items in player and container slots — blocks autosort/shift-click moves, reserves anchored stacks for hoppers/crafters, with GUI, wand, and admin tools.

## Entry (`plugin.yml`)

- **Main:** `com.anchors.plugin.AnchorsPlugin`
- **Commands:** `/anchors` (aliases `anchor`, `an`) — `help`, `gui`, `wand`, `toggle`, `item`, `public`, `inventory`, `clear`, `list`, `admin`, `reload`

## Startup (`AnchorsPlugin.onEnable`)

1. `PluginConfig`; `AnchorStore` + `AnchorInventoryWideLock` load; `AnchorItemTags`, session/death guards.
2. `AnchorTooltips` + refresh scheduler; `AnchorInventoryPolicy`, `AnchorItemWorldDamagePolicy`.
3. `AnchorInventoryListener`; `verifyRuntimeClasses()` gate before full registration.

## Permissions

| Node | Default | Role |
| ---- | ------- | ---- |
| `anchors.use` | true | GUI, private/public anchors |
| `anchors.public` | true | Legacy alias for container public clears |
| `anchors.admin` | op | Admin GUI, reload |
| `anchors.bypass` | op | Move items out of locked slots |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Anchors lost on death | `AnchorDeathGuard`, session tracker |
| Hopper still pulls stack | Reserve policy in inventory listener |
| Boot aborted early | `verifyRuntimeClasses()` failure in log |

---

**Sources (audited):** `anchors/plugin/src/main/resources/plugin.yml`, `anchors/plugin/src/main/java/com/anchors/plugin/AnchorsPlugin.java`