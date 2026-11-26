---
title: HardResetPanel
description: Admin UI for manual PWA hard-reset diagnostics
---

# HardResetPanel

Client dev/admin panel for inspecting and triggering `hard-reset-manager` resets (service workers, caches, storage).

## Exports

- Default export: `HardResetPanel` — no props (`React.FC`)

## Behavior

- Polls `getResetStats()` on mount and every 5s (last version, timestamp, count, first visit).
- **Manual Hard Reset** / **Test Reset:** `window.confirm`, then `triggerManualHardReset(reason)`; shows `HardResetResult` (items cleared, errors). Reloads page 2s after successful reset.
- **Refresh Stats:** synchronous `loadResetStats()`.
- Footer lists console helpers (`triggerHardReset`, `__originalConsole`).
- Logger context `HardResetPanel` is created with `enabled: false`.

---

**Sources:** `src/app/components/dev-tools/HardResetPanel.tsx`, `@lib/utils/hard-reset-manager`