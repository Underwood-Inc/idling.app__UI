---
title: Avatar test selectors
description: data-testid constants for Avatar component E2E
---

# Avatar selectors (`src/app/lib`)

Co-located Playwright/test id map for app-tree Avatar usage (distinct from `@lib/test-selectors` root).

## Export

`AVATAR_SELECTORS` const object:

| Key | Value |
|-----|-------|
| `CONTAINER` | `avatar__container` |
| `LOADER` | `avatar__loader` |
| `IMG` | `avatar__img` |

Frozen `as const` for type narrowing in tests.

---

**Sources:** `src/app/lib/test-selectors/components/avatar.selectors.ts`