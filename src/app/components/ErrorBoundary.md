---
title: ErrorBoundary
description: Class boundary with generic fallback UI
---

# ErrorBoundary

React class boundary (`'use client'`).

## Props

- `children: ReactNode`
- `fallback?: ReactNode` — shown when `hasError`

## Behavior

- `getDerivedStateFromError` → `{ hasError: true }` (no error message surfaced)
- `componentDidCatch` → `console.error`
- Render: fallback or `<div>Error loading content</div>`

Does not reset on navigation — state sticky until remount.

---

**Sources:** `src/app/components/ErrorBoundary.tsx`