---
title: RetroSpaceBackground
description: User-preference-driven starfield background layer
---

# RetroSpaceBackground

Default export client background. Optional prop overrides for `movementDirection`, `movementSpeed`, and `enableSpeedLines`; otherwise reads `backgroundMovementDirection`, `backgroundMovementSpeed`, and `backgroundAnimationLayers` from `UserPreferencesContext`.

Defers animated DOM until `isMounted` to avoid hydration mismatch. SCSS in `RetroSpaceBackground.scss`.

---

**Sources:** `src/app/components/retro-space-background/RetroSpaceBackground.tsx`, `@lib/context/UserPreferencesContext`