---
title: ClientLogger
description: Browser-safe Logger subclass
---

# ClientLogger

`class ClientLogger extends Logger` — client context defaults, avoids server-only transports, respects `window` availability.

Create via `createClientLogger(config?)`.

---

**Sources:** `src/lib/logging/adapters/ClientLogger.ts`