---
title: PageAside
description: Scrollable aside column with optional bottom spacer
---

# PageAside

`'use client'` secondary column layout.

## Props

| Prop | Default |
|------|---------|
| `children` | required |
| `bottomMargin` | `0` (rem spacer below aside when > 0) |
| `className` | optional on `<aside>` |

## Test ids

Outer `page-aside-container`; aside uses `PAGE_ASIDE_SELECTORS.ASIDE`.

Structure: container → aside → panel → scroll region.

---

**Sources:** `src/app/components/page-aside/PageAside.tsx`