---
title: service-worker-cleanup
description: Dev-console utilities to inspect and reset service workers
---

# service-worker-cleanup

Browser-only maintenance helpers (also exposed on `window` for console use). Preserves radio IndexedDB via `deleteNonPreservedIndexedDatabases` where applicable.

## Functions

| Function | Purpose |
| -------- | ------- |
| `diagnoseServiceWorkerIssues` | Recommended fix path |
| `inspectServiceWorkers` | Log registrations and controllers |
| `enforceOneServiceWorker` | Collapse duplicate registrations |
| `advancedServiceWorkerCleanup` | Unregister + cache sweep |
| `nukeAllServiceWorkers` | Aggressive unregister |
| `nuclearServiceWorkerReset` | Full reset workflow |
| `displayServiceWorkerNukeInstructions` | ASCII help banner |

On load, logs available console commands in development-oriented messaging.

Not for production user flows — operator/debug tooling only.

---

**Sources:** `src/lib/utils/service-worker-cleanup.ts`