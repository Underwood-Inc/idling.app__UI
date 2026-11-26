---
title: SiteChromeProviders
description: Root client provider nesting for idling.app
---

# SiteChromeProviders

Client wrapper nesting ambient background, ads script, Microsoft Clarity, `SessionProvider`, locale, user preferences, overlay, navigation/global loading, user data batch, radio player, and visualizer contexts.

Also mounts `RadioPwaStandaloneVisualizerBootstrap`, `ServiceWorkerRegistration`, `RadioPlayerMountWrapper`, `VisualizerModeGate`, and `IdlingLocaleProvider` around `children`.

---

**Sources:** `src/app/components/site-chrome/SiteChromeProviders.tsx`