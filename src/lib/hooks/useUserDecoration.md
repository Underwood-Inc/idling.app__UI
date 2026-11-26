---
title: useUserDecoration
description: Batched fetch of profile decoration string
---

# useUserDecoration

Client hook returning Discord-style decoration asset for a `userId`, with optional `forceDecoration` override.

Uses `useUserDataBatch` to dedupe API calls. Returns `decoration`, `isLoading`, `error`, `refresh`. `enabled` defaults to `true`.

---

**Sources:** `src/lib/hooks/useUserDecoration.ts`