---
title: badge selectors
description: data-testid map for Badge component
---

# badge selectors

Exported const `BADGE_SELECTORS` (`as const`) — maps logical regions of `Badge.tsx` / `BadgeWrapper` to `data-testid` strings for E2E.

| Key | test id | DOM |
|-----|---------|-----|
| `CONTAINER` | `badge__container` | Wraps children + badge chip |
| `CONTENT` | `badge__content` | Clickable badge overlay |

Import from `@lib/test-selectors/components/badge` (path alias) in tests; do not hard-code strings in specs.

---

**Sources:** `src/lib/test-selectors/components/badge.ts`, `src/app/components/badge/Badge.tsx`