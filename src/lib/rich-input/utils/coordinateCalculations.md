---
title: coordinateCalculations
description: Map DOM positions to rich-input text indices
---

# coordinateCalculations

Low-level bridge between contenteditable DOM and logical string indices.

Key exports: `calculateCursorCoordinates`, `calculateCursorFromRenderedContent`, `calculateSelectionCoordinates`, `calculateClickPosition`, `createPositionFromIndex`, `snapToPillBoundary`, `findTextNodeAndOffset`, `getTextIndexFromDOMPosition`.

Used by click and selection pipelines before enhanced token-aware passes.

---

**Sources:** `src/lib/rich-input/utils/coordinateCalculations.ts`