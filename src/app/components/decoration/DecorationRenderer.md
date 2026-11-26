---
title: DecorationRenderer
description: Subscription flair visual effects around arbitrary children
---

# DecorationRenderer

Client component (`memo`) that wraps children with tier-specific decoration chrome (glow, crown, particles) or loading/error fallbacks. Business-agnostic: accepts a decoration id string, not subscription types.

## Exports

- `DecorationVariant` — union of known effect ids (`enterprise-crown`, `premium-galaxy`, `pro-plasma`, `active-glow`, `trial-pulse`)
- `DecorationConfig` — `{ variant, className?, data-testid? }`
- `DecorationRenderer` — named export

## Props (`DecorationRendererProps`)

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `decoration` | `string \| null` | — | When null or while loading, plain wrapper (or scrambler) |
| `children` | `ReactNode` | — | Content inside effects |
| `className` | `string` | `''` | Appended to `decoration-renderer` |
| `isLoading` | `boolean` | `false` | Shows `TextScramblerEffect` on extracted child text |
| `error` | `string \| null` | `null` | With `showError`, shows alert icon + `title` |
| `showError` | `boolean` | `false` | Error chrome |
| `data-testid` | `string` | — | Root `data-testid` |

## Behavior

- **Loading / no decoration:** `data-loading` on root; scrambler uses word-boundary same-character mode at speed 60.
- **Error:** `decoration-renderer--error` + `SiteIcon` `alertTriangle`.
- **Decorated:** Applies `decoration-renderer--{decoration}` and variant-specific overlays (`SiteIcon` crown/star/sparkles/gem for galaxy, glow/pulse layers for others). Content lives in `decoration-renderer__content`.

---

**Sources:** `src/app/components/decoration/DecorationRenderer.tsx`, `src/app/components/decoration/TextScramblerEffect.tsx`, `src/app/components/decoration/DecorationRenderer.css`