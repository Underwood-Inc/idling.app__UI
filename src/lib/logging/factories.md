---
title: logging factories
description: createLogger and scoped logger constructors
---

# logging factories

| Factory | Returns |
| ------- | ------- |
| `createLogger` | Generic `LoggerInstance` |
| `createServerLogger` | `ServerLogger` + SigNoz when `SIGNOZ_ENDPOINT` set |
| `createClientLogger` | `ClientLogger` |
| `createDebugLogger` | Verbose `DebugLogger` |
| `createComponentLogger` | Pre-filled `context.component` |
| `createModuleLogger` | Pre-filled `context.module` |
| `createFunctionLogger` | Pre-filled `context.function` |
| `createCategoryLogger` | Pre-filled `context.category` |

Prefer factories over `new Logger()` so transports and environment defaults stay consistent.

---

**Sources:** `src/lib/logging/factories.ts`