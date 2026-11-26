---
title: batchedUpdater
description: Queue and merge rapid Jotai atom updates atomically
---

# batchedUpdater

Singleton `BatchedAtomUpdater` coalesces multiple `updater` functions per `atomKey` into one setter call (microtask/`batchDelay` scheduling) to avoid flaky intermediate UI states.

## Exports

- **`batchedUpdater`** — `registerAtom`, `queueUpdate`, `flushAtom`, etc.
- **`createBatchedAtomUpdater(atomKey, setAtom)`** — Wire an atom to the queue.
- **`createBatchedSetter`** — Helper returning a batched-compatible setter.

Use when filter or radio state receives bursts of updates within the same frame.

---

**Sources:** `src/lib/state/batchedUpdater.ts`