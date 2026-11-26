---
title: instrumentation
description: Next.js OpenTelemetry bootstrap for SigNoz
---

# instrumentation

Next.js `register()` hook (Node runtime only).

When `SIGNOZ_ENDPOINT` is set, initializes OpenTelemetry exporters for traces, metrics, and logs (`OTEL_SERVICE_NAME` defaults to `idling-app`). Normalizes endpoint URL with `https://` when protocol missing; no-ops with console message when unset.

Loaded automatically per [Next instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation).

---

**Sources:** `src/instrumentation.ts`