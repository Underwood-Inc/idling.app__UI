---
title: logging types
description: Log levels, entries, config, and transport contracts
---

# logging types

Shared types for the consolidated logging stack.

## Levels and context

- **`LogLevel`** — `DEBUG` … `PERF`
- **`LogContext`** — component, module, function, user/session/request ids, category
- **`LogEntry`** — message, structured `data`, timestamp, optional `error`, `duration`

## Configuration

- **`LoggerConfig`** — enabled, level, formatters, transports, grouping, performance thresholds
- **`LogTransport`** / **`LogFormatter`** — plugin interfaces
- **`LoggerInstance`** — method surface implemented by `Logger` and adapters

Import from here in transports and adapters — avoid duplicating inline shapes.

---

**Sources:** `src/lib/logging/types.ts`