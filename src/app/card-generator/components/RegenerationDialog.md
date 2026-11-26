---
title: RegenerationDialog
description: Same-params regen choice modal
---

# RegenerationDialog

Named export — shown when `useImageGeneration` detects unchanged form snapshot.

## Props

`isOpen`, `onClose`, `onChoice('same' | 'random')`.

Offers regenerate with identical parameters vs randomize seeds before retry. Modal overlay in `RegenerationDialog.module.css`.

---

**Sources:** `src/app/card-generator/components/RegenerationDialog.tsx`, `src/app/card-generator/components/RegenerationDialog.module.css`, `src/app/card-generator/hooks/useImageGeneration.ts`