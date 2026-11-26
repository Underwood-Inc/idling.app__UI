---
title: SigNozTransport
description: Ship structured logs to SigNoz OpenTelemetry endpoint
---

# SigNozTransport

`LogTransport` implementation that batches `LogEntry` records to `SIGNOZ_ENDPOINT` on the server.

Exports: `SigNozTransport`, `createSigNozTransport`, default export.

Wired automatically in `createServerLogger` when env is set.

---

**Sources:** `src/lib/logging/transports/SigNozTransport.ts`