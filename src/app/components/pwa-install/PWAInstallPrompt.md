---
title: PWAInstallPrompt
description: Deferred install banner for supported browsers
---

# PWAInstallPrompt

Default export client banner mounted from site chrome.

Listens for `beforeinstallprompt` (stores `deferredPrompt`, shows UI after delay if not already installed). Detects installed state via `display-mode: standalone`, iOS `navigator.standalone`, and Android referrer heuristics.

User accept calls `deferredPrompt.prompt()` and tracks outcome; dismiss hides the prompt. `appinstalled` clears state. UI in `PWAInstallPrompt.css` with `SiteIcon` accents.

---

**Sources:** `src/app/components/pwa-install/PWAInstallPrompt.tsx`