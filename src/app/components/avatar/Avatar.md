---
title: Avatar
description: DiceBear adventurer avatars with Jotai cache and optional tooltip
---

# Avatar

Default memoized client component (`Avatar`) for deterministic DiceBear SVG avatars.

## Props

- `seed?: string` — when omitted, one random `fallback-{id}` per mount via `useMemo`.
- `size?: AvatarPropSizes` — `'full' | 'lg' | 'md' | 'sm' | 'xs' | 'xxs'` (default `'md'`).
- `enableTooltip?: boolean` — wraps with `InteractiveTooltip` showing scaled duplicate image.
- `tooltipScale?: 2 | 3 | 4` — default `2`.

## Generation

`createAvatar(adventurer, { seed: stableSeed })` → data URI. Failures log error and show loading placeholder (`data-testid="avatar-loading"`).

## Cache

`avatarCacheAtom` stores `{ [seed]: dataUri }`. Writes on generate; read skips regeneration.

## Tooltip

Mouse enter positions tooltip at horizontal center of avatar; enlarged size maps `xs`/`xxs` to `lg` in tooltip content.

## Exports

- `Avatar` (named)
- Type `AvatarPropSizes`

## Edge cases

- Cache write failures are warned, not thrown.
- `displayName` set to `'Avatar'`.

---

**Sources:** `src/app/components/avatar/Avatar.tsx`