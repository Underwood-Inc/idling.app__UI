---
title: Card generator layout
description: Suspense boundary with MysticalLoader fullscreen fallback
---

# Card generator layout

Wraps all `/card-generator` pages in `Suspense`.

## Fallback

`MysticalLoader` with `message="Awakening the ancient card creation chamber..."` and `fullScreen={true}`.

## Purpose

Child page uses `useSearchParams` and other client hooks that require Suspense in App Router.

---

**Sources:** `src/app/card-generator/layout.tsx`, `src/app/card-generator/components/MysticalLoader.tsx`