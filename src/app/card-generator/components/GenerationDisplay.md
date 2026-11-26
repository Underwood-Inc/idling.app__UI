---
title: GenerationDisplay
description: SVG preview with generation id and copy control
---

# GenerationDisplay

Named export — renders successful output.

## Props

| Prop | Role |
|------|------|
| `svgContent` | inline SVG markup (required to render) |
| `generationId` | optional share id + copy button |
| `onCopyId` | clipboard handler from parent |

Returns `null` when `svgContent` empty. CSS modules under `GenerationDisplay.module.css`.

---

**Sources:** `src/app/card-generator/components/GenerationDisplay.tsx`, `src/app/card-generator/components/GenerationDisplay.module.css`