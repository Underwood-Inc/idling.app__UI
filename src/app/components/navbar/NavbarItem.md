---
title: NavbarItem
description: Navbar slot with optional disabled state
---

# NavbarItem

Layout primitive wrapping one item in the desktop/mobile navbar flex row. No routing or click handling — children supply links/buttons.

## Props

| Prop | Default | Behavior |
|------|---------|----------|
| `children` | required | Slot content (links, buttons, search) |
| `className` | `''` | Appended to `navbar__item` |
| `isDisabled` | `false` | Sets `aria-disabled` on the wrapper (does not block pointer events by itself) |
| `testId` | `NAV_PATHS_SELECTORS.ITEM` | `data-testid` for Playwright |

## Render

Single `div.navbar__item` with optional `aria-disabled` and test id. Used by `Navbar`, `NavPaths`, and auth slots for consistent spacing and test hooks.

---

**Sources:** `src/app/components/navbar/NavbarItem.tsx`, `src/lib/test-selectors/components/nav-paths.selectors`