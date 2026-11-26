---
title: useApiWrapperData
description: Consume universal API response side-channel data
---

# useApiWrapperData

Processes envelope fields attached by `withUniversalEnhancements`: `activeAlertsInfo`, `timeoutInfo`, `userPermissions`, `userRoles`.

## Exports

| Symbol | Role |
| ------ | ---- |
| `ApiWrapperData` | Shape of side-channel payload |
| `useApiWrapperData(processor)` | Registers processor on global `ApiWrapperDataManager` |
| `useSessionDataSync()` | Pushes `timeoutInfo` into `updateSessionDataAtom` |
| `processApiWrapperData` / `extractAndProcessWrapperData` | Imperative hooks for fetch clients |

Replaces polling dedicated alert/timeout endpoints when API responses include wrapper metadata.

---

**Sources:** `src/lib/hooks/useApiWrapperData.ts`