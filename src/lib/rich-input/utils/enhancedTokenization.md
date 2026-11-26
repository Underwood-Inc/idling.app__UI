---
title: enhancedTokenization
description: Bridge ContentParser tokenization to rich tokens
---

# enhancedTokenization

Converts `TokenizedContent` into `RichContentToken[]` and supplies smart editing helpers:

`getEnhancedCursorPosition`, `getNextWordPosition`, `getSmartSelection`, `getCursorContext`, `insertTextSmart`.

Re-exports `ContentParser` and `TokenizedContent` from `@lib/utils/content-parsers`.

---

**Sources:** `src/lib/rich-input/utils/enhancedTokenization.ts`