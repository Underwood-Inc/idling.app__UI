---
title: NotFoundErrorBoundary
description: Class error boundary with refresh fallback UI
---

# NotFoundErrorBoundary

Client class component catching render errors and showing a minimal recovery panel.

## Exports

- `NotFoundErrorBoundary` — class extending `Component<Props, State>`

## Props

| Prop | Type |
|------|------|
| `children` | `ReactNode` |

## State

- `hasError`, `error` — set by `getDerivedStateFromError`

## Behavior

- `componentDidCatch` logs to `console.error`.
- Fallback: heading, refresh copy, button clears error state and calls `window.location.reload()`.
- Styles: `NotFoundErrorBoundary.css` (`error-boundary`).

---

**Sources:** `src/app/components/error-boundary/NotFoundErrorBoundary.tsx`, `src/app/components/error-boundary/NotFoundErrorBoundary.css`