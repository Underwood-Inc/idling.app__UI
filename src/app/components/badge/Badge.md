---
title: Badge (BadgeWrapper)
description: Overlay badge chip on children with optional hover-only mode
---

# Badge

Default export `BadgeWrapper` in `Badge.tsx`.

## Props

- `badgeContent: ReactNode`
- `children: ReactNode`
- `onClick?` — when set, badge is pointer + `preventDefault` on click
- `showOnHover` — adds `--hover` on container (CSS-driven visibility)

## Markup

`badge__container` wraps children + `badge__content` span with `BADGE_SELECTORS`.

## Note

Filename is `Badge.tsx` but component identifier is `BadgeWrapper`.

---

**Sources:** `src/app/components/badge/Badge.tsx`