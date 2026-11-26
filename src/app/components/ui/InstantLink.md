---
title: InstantLink
description: Next.js Link with navigation loading feedback and modifier-key passthrough
---

# InstantLink

Wraps `next/link` with `useNavigationLoader` for instant loading class/state and an inline spinner while the target route resolves.

## Props

Mirrors common anchor props: `href`, `children`, `prefetch` (default `true`), `scroll`, `target`, `title`, `className`, `data-testid`, `aria-disabled`, `onClick`.

## Click rules

- Custom `onClick` runs first.
- Skips interception for `_blank`, `aria-disabled`, modifier keys, or when already on `href` (`preventDefault` only).
- Otherwise `preventDefault` + `navigate(href, { scroll })`.

## CSS states

`instant-link--active`, `instant-link--loading`, `instant-link--disabled`; loading row includes `aria-live="polite"` “Loading” text.

---

**Sources:** `src/app/components/ui/InstantLink.tsx`, `@lib/hooks/useNavigationLoader`