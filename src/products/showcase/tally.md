---
title: Tally
description: Advancement datapack runtime, reward policy GUI, admin commands
---

# Tally

**What this is:** **Paper** plugin (`api-version: 26.3`, `load: STARTUP`) — Tally advancement datapack plus runtime reward policy, admin chest GUIs, and advancement grant/revoke commands.

## Entry (`plugin.yml`)

- **Main:** `com.tally.plugin.TallyPlugin`
- **Commands:** `/tally` (alias `tallyadmin`) — `admin`, `reload`, `reward`, `advancement`, …

## Startup (`TallyPlugin.onEnable`)

- `PluginConfig`, `RewardOverridesStore`, `RewardPolicyService`, `RewardResolver`
- Datapack: `DatapackBridge`, `DatapackInstaller`, `DatapackRewardBridge` — `datapackBootstrapped` and `replayRewardOverridesToDatapack()` after install
- `AdvancementCatalog`; `AdminMenuListener` and anvil search listeners for advancement/reward editing
- `ShirecraftRuntime` install handle (shared craft runtime)

## Permissions

| Node | Default | Role |
| ---- | ------- | ---- |
| `tally.admin` | op | Full admin tree |
| `tally.admin.gui` | op | Policy chest menus |
| `tally.admin.reload` | op | Config + advancement index |
| `tally.admin.reward` | op | Per-advancement overrides |
| `tally.admin.advancement` | op | Grant/revoke/inspect |
| `tally.*` | op | Wildcard |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Datapack rewards stale | `replayRewardOverridesToDatapack()` after policy edits |
| Pack missing on boot | `DatapackInstaller` severe logs |

---

**Sources (audited):** `tally/plugin/src/main/resources/plugin.yml`, `tally/plugin/src/main/java/com/tally/plugin/TallyPlugin.java`