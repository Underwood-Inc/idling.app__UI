---
title: Logger
description: Base logger with levels, grouping, and transports
---

# Logger

`class Logger implements LoggerInstance` — environment-aware defaults from `logging/config`, emoji context prefix, level gating, console + configured transports, optional log grouping and perf timers.

Extended by `ClientLogger`, `ServerLogger`, and `DebugLogger`; constructed via `createLogger` factories.

---

**Sources:** `src/lib/logging/core/Logger.ts`