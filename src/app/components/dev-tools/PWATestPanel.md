---
title: PWATestPanel
description: Development panel for PWA install and service worker status
---

# PWATestPanel

Client diagnostic surface for standalone display mode, install prompt availability, and service worker readiness.

## Exports

- Default export: `PWATestPanel` — no props

## Behavior

- On mount: sets `isStandalone` from `display-mode: standalone` or iOS `navigator.standalone`; probes `navigator.serviceWorker.ready` (`active` / `error` / `not supported`).
- Listens for `beforeinstallprompt` to flip `installPromptAvailable`.
- **Test Install Prompt** dispatches synthetic `beforeinstallprompt` on `window`.
- Static checklist of implemented PWA features (manifest, SW, offline, icons, etc.).

---

**Sources:** `src/app/components/dev-tools/PWATestPanel.tsx`