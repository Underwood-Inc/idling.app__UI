---
title: AvatarsBackground
description: Fixed full-viewport floating DiceBear avatars animation
---

# AvatarsBackground

Default export client decorative layer: up to 8 drifting avatars with `requestAnimationFrame`.

## Layout

- `position: fixed`, full viewport, `pointerEvents: 'none'`, `zIndex: -1` (`1000` when `DEBUG_MODE`).
- `aria-hidden="true"`.

## Internal `BackgroundAvatar`

Props `seed`, `size: 'sm' | 'md'`. Generates DiceBear adventurer data URI per seed (no Jotai cache). Returns `null` on failure.

## Spawning

Every 2s (`GENERATION_INTERVAL`) if under `MAX_AVATARS` (8). Initial spawn effect resets map and backdates `lastSpawnRef` for immediate first avatar.

`spawnAvatar` places `y` between `height - 300` and `height + 100` for visibility.

## Motion

Upward velocity with light wind/gravity jitter; rotation; opacity fades last 20% of lifetime. Removed when expired or off-screen (3s grace if newly off-screen).

## Lifecycle

- Pauses when `document.hidden` (`visibilitychange`).
- Resize updates viewport state.
- Cancels animation frame on unmount / deactivate.

## Constants (selected)

Lifetime 15–35s; fade duration 2s; sizes 60–80px config (rendered box 50px); opacity 0.4–0.8; `DEBUG_MODE` false in source.

## Exports

`export default AvatarsBackground`.

---

**Sources:** `src/app/components/avatars-background/AvatarsBackground.tsx`