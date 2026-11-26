---
title: Coin
description: Decorative coin frame around deterministic Avatar
---

# Coin

`'use client'` default export.

## Props

| Prop | Type | Default |
|------|------|---------|
| `seed` | `string` | required — passed to `Avatar` |
| `size` | `'full' \| 'lg' \| 'md' \| 'sm'` | `'lg'` |

## Initials logic

- Whitespace in seed → first char of first two words
- Else → first + last character, uppercased
- Shown on header/footer bands; center is `Avatar`

## Markup / a11y

Front face (`coin__front`) + back face text `BACK`. Uses `COIN_SELECTORS` test ids on front, header, body, back.

## Exports

`CoinPropsSize` type; default `Coin` component.

---

**Sources:** `src/app/components/coin/Coin.tsx`, `@lib/test-selectors/components/coin.selectors`