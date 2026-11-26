---
title: HardResetManager
description: Version-driven client cache and storage reset
---

# HardResetManager

On mount, reads `meta[name="app-version"]`, loads `getResetStats()`, then `checkAndPerformHardReset` with the detected version. Logs reset outcome; may reload the page when a reset runs (`showNotification: true`).

Renders nothing. Logger context `HardResetManager` (disabled by default).

---

**Sources:** `src/app/components/service-worker/HardResetManager.tsx`, `@lib/utils/hard-reset-manager`