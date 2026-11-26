---
title: useWelcomeFlow
description: Welcome screen vs editor routing for card generator
---

# useWelcomeFlow

Controls first-run welcome vs main generator UI.

## State

- `showWelcome` — default true unless URL has `?id=` generation param
- `loadGenerationId` — input for “open existing” flow

## Actions

| Handler | Effect |
|---------|--------|
| `handleLoadGeneration` | `router.push('/card-generator?id=…')` |
| `handleNewGeneration` | hides welcome |
| `returnToWelcome` | reset + `router.replace('/card-generator')` |
| `clearWelcomeFlow` | reset state only |

Uses `useSearchParams` + `useRouter` from `next/navigation`.

---

**Sources:** `src/app/card-generator/hooks/useWelcomeFlow.ts`