---
title: NavigationLoadingBar
description: Top-of-viewport progress bar for route and global loading
---

# NavigationLoadingBar

Client-only top bar driven by `NavigationLoadingContext` and `GlobalLoadingContext`.

## Behavior

- Renders `null` until `isClient` and visible.
- When `isNavigating` or global loading: shows bar, animates pseudo-progress toward 90% on an interval.
- On idle: jumps to 100%, hides after 500ms.
- `aria-label` prefers ``Loading ${targetPath}...`` else `loadingMessage`.

## Usage

Mount once in site chrome (typically beside `NavigationLoadingProvider`). No props.

---

**Sources:** `src/app/components/ui/NavigationLoadingBar.tsx`, `@lib/context/NavigationLoadingContext`, `@lib/context/GlobalLoadingContext`