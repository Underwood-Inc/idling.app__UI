---
title: FadeIn
description: Mount-time opacity transition on selectable element tag
---

# FadeIn

`'use client'` wraps children with CSS class `fade-in` → `fade-in visible` after mount `useEffect`.

## Props

- `display?: DisplayType` — `DIV` (default), `SPAN`, `P`, `CODE`, `LI`
- `className`, `style` forwarded

## Test ids

`data-testid={FADE_IN_SELECTORS[display]}` per tag variant.

## Exports

`DisplayType` enum + default `FadeIn` component.

---

**Sources:** `src/app/components/fade-in/FadeIn.tsx`