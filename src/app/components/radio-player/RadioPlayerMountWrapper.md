---
title: RadioPlayerMountWrapper
description: Site chrome fragment mounting the player and audio energy bridge
category: component
---

# RadioPlayerMountWrapper

`'use client'` fragment mounted from site chrome (alongside footer/nav). Composes the **radio stack** with no props and no local state.

## Children (fixed order)

1. **`RadioPlayerMount`** with `autoplay={false}` — imperative player engine + `RadioPlayerBar`.
2. **`RadioAudioEnergyBridge`** — null-render effect that publishes analyser energy for dock/fullscreen visualizers.

## Behavior

Always mounts both siblings; feature gating (if any) happens on the parent chrome that conditionally renders this wrapper, not inside this file. Autoplay is explicitly off at the wrapper layer so first playback stays user-gesture driven unless a nested route overrides via context.

## Related

Pair with `radio-pwa` bootstraps when the app runs as an installed radio PWA; browser tab uses this wrapper from `SiteChromeShell` patterns.

---

**Sources:** `src/app/components/radio-player/RadioPlayerMountWrapper.tsx`, `src/app/components/radio-player/RadioPlayerMount.tsx`, `src/app/components/radio-player/RadioAudioEnergyBridge.tsx`, `src/app/components/site-chrome`