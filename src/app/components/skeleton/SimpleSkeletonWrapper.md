---
title: SimpleSkeletonWrapper
description: Delayed loading placeholder with submission-shaped fallback
---

# SimpleSkeletonWrapper

Props: `children`, `isLoading`, optional `className`, `expectedItemCount`, `fallbackMinHeight`, `delayMs` (anti-flicker delay before showing skeleton).

When loading after delay, repeats `SubmissionSkeleton` blocks (box + text bars + pill chips). Otherwise renders `children`. Shares `SkeletonLoader.css` primitives.

---

**Sources:** `src/app/components/skeleton/SimpleSkeletonWrapper.tsx`