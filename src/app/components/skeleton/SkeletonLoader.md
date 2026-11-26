---
title: SkeletonLoader
description: Primitive skeleton shapes and smart loader utilities
---

# SkeletonLoader

Exports low-level placeholders: `SkeletonText`, `SkeletonBox`, `SkeletonCircle`, configurable `SkeletonLoader`, `SmartSkeletonLoader`, hook `useSmartSkeleton` (measures a `targetRef`), and default export `SmartSkeletonLoader`.

`useSmartSkeleton` reads target dimensions to size shimmer elements. Shared styles: `SkeletonLoader.css`.

Note: `SmartSkeletonLoader.tsx` is a parallel implementation with extended layout logic; prefer the import path your feature already uses.

---

**Sources:** `src/app/components/skeleton/SkeletonLoader.tsx`, `src/app/components/skeleton/SmartSkeletonLoader.tsx`