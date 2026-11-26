---
title: WelcomeInterface
description: Landing step to start new or load existing generation
---

# WelcomeInterface

Named export — entry screen before the main generator layout.

## Props

Quota props (`remainingGenerations`, `quotaLimit`, `hasInitializedQuota`, `isQuotaExceeded`, `resetDate`) passed through to embedded `QuotaDisplay` (`welcome` layout).

Generation id field: `loadGenerationId` / `setLoadGenerationId`, handlers `onNewGeneration`, `onLoadGeneration`.

Localized copy from `useToolsCopy().cardGenerator.welcome` and `COMMON_EN` via `useIdlingLocale`.

---

**Sources:** `src/app/card-generator/components/WelcomeInterface.tsx`, `src/app/card-generator/components/WelcomeInterface.module.css`, `src/app/card-generator/components/QuotaDisplay.tsx`