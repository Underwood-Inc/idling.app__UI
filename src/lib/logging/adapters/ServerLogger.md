---
title: ServerLogger
description: Server Logger with optional SigNoz transport
---

# ServerLogger

`class ServerLogger extends Logger` — used in API routes, server actions, and RSC data loaders.

`createServerLogger` merges SigNoz transport when `SIGNOZ_ENDPOINT` is defined.

---

**Sources:** `src/lib/logging/adapters/ServerLogger.ts`