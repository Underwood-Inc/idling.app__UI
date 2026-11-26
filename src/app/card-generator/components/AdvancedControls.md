---
title: AdvancedControls
description: Pro-only fine tuning for OG layout and watermark
---

# AdvancedControls

Named export — collapsible Pro controls editing `Partial<GenerationOptions>`.

## Props

`options`, `onOptionsChange`, `isProUser`, optional `isReadonly`, optional `generationOptions` defaults from last API response.

When `!isProUser`, inputs are disabled; copy from `useToolsCopy().cardGenerator.advancedControls`.

Covers avatar position/size, typography, border/glass, pattern seed, watermark toggles/position/opacity (see full field list in source).

Parent: `GenerationForm` (and page-level `advancedOptions` state).

---

**Sources:** `src/app/card-generator/components/AdvancedControls.tsx`, `src/app/card-generator/components/AdvancedControls.module.css`, `src/app/card-generator/types/generation.ts`