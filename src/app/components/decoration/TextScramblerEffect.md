---
title: TextScramblerEffect
description: Loading-state character scramble with stable width
---

# TextScramblerEffect

Client component that cycles random characters at fixed string length while `isActive`, for placeholder loading without revealing real labels.

## Exports

- `TextScramblerEffect` — function component
- `TextScramblerEffectProps` — interface

## Props (`TextScramblerEffectProps`)

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `originalText` | `string` | — | Target length and recovery text when inactive |
| `isActive` | `boolean` | — | Enables interval scrambling |
| `speed` | `number` | `50` | Interval ms |
| `characters` | `string` | alphanumeric set | Pool when `useSameCharacters` is false |
| `useSameCharacters` | `boolean` | `false` | Scramble using only chars from `originalText` |
| `respectWordBoundaries` | `boolean` | `false` | Per-word char pools when combined with same-char mode |
| `className` | `string` | `''` | On visible span |
| `children` | `ReactNode` | — | Rendered when inactive instead of `originalText` |

## Behavior

- When `useSameCharacters`, measures max width via hidden span (`calculateMaxWidth`) and sets `minWidth` to avoid layout shift; waits for calculation before scrambling.
- Inactive: children or `originalText`; active: visible scrambled text is `aria-hidden` with SR-only "Loading decoration for …".
- Preserves spaces, `_`, and `-` in all scramble modes.

---

**Sources:** `src/app/components/decoration/TextScramblerEffect.tsx`, `src/app/components/decoration/TextScramblerEffect.css`