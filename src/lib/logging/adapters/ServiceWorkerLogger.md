---
title: ServiceWorkerLogger
description: Lightweight logger for service worker scripts
---

# ServiceWorkerLogger

Standalone `ServiceWorkerLogger` (not extending `Logger`) — posts or mirrors log lines from SW context where full client logger is unavailable.

- **`ServiceWorkerLoggerConfig`** — level and forward target.
- **`swLogger`** — default instance.

---

**Sources:** `src/lib/logging/adapters/ServiceWorkerLogger.ts`