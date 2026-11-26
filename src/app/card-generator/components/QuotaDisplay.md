---
title: QuotaDisplay
description: Remaining generations meter with reset countdown
---

# QuotaDisplay

Named export — visualizes `QuotaState` with optional layouts.

## Props

Extends `QuotaState`; flags `showMeter`, `mobile`, `welcome` switch CSS module classes (`quota__section`, `quota__mobile`, `quota__welcome`).

Shows remaining/limit, exceeded state, dynamic reset text from `resetDate`, tooltips via `InteractiveTooltip`, upgrade links via `InstantLink`.

---

**Sources:** `src/app/card-generator/components/QuotaDisplay.tsx`, `src/app/card-generator/components/QuotaDisplay.module.css`, `src/app/card-generator/types/generation.ts`