---
title: IntelligentSkeletonWrapper
description: DOM-capture skeleton that mirrors loaded content layout
---

# IntelligentSkeletonWrapper

Advanced loading wrapper: while `isLoading`, captures rendered child DOM geometry and styles into a `CapturedElement` tree, then paints matching skeleton placeholders (text, box, circle primitives).

Includes resize/ mutation observers, optional min display time, and structured logging (disabled by default). Large client module intended for complex feed layouts where static skeletons misrepresent structure.

---

**Sources:** `src/app/components/skeleton/IntelligentSkeletonWrapper.tsx`