---
title: FancyBorder
description: Decorative wrapper div for children
---

# FancyBorder

Server-friendly default export wrapping children in `fancy-border` CSS frame.

## Exports

- Default export `FancyBorder`

## Props (inline)

| Prop | Type | Behavior |
|------|------|----------|
| `children` | `React.ReactNode` | Inner content |
| `className` | `string` | Optional extra class on root |

## Render

Root: `className={`fancy-border${className ? ` ${className}` : ''}`}`.

---

**Sources:** `src/app/components/fancy-border/FancyBorder.tsx`, `src/app/components/fancy-border/FancyBorder.css`