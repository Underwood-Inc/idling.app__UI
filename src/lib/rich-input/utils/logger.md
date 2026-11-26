---
title: rich-input logger
description: Debug logging for rich editor click/cursor/selection
---

# rich-input logger

`RichTextLogger` singleton with structured debug types (`ClickDebugInfo`, `CursorDebugInfo`, `SelectionDebugInfo`).

Convenience: `logClick`, `logCursor`, `logSelection`, `logParsing`, `logCursorPositioning`.

Plaintext mode toggles: `enablePlaintextLogging`, `disablePlaintextLogging`, `isPlaintextLogging`.

Development-only; default logger instance is `richTextLogger`.

---

**Sources:** `src/lib/rich-input/utils/logger.ts`