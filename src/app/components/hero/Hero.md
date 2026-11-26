---
title: Hero
description: Marketing hero title and subtitle block
---

# Hero

Client page hero with optional accent span in the title.

## Exports

- `Hero` — named export
- `HeroProps` — interface (inline in module)

## Props (`HeroProps`)

| Prop | Type | Behavior |
|------|------|----------|
| `title` | `string` | Main `h1` text |
| `subtitle` | `string` | Paragraph under title |
| `accentText` | `string` | Optional `hero__accent` span appended in `h1` |

## Render

`Hero.module.css` classes: `hero`, `hero__content`, `hero__title`, `hero__subtitle`.

---

**Sources:** `src/app/components/hero/Hero.tsx`, `src/app/components/hero/Hero.module.css`