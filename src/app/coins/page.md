---
title: Coins demo page
description: Session-seeded Coin avatar inside Card
---

# Coins page

Async Server Component demo for the `Coin` visual.

## Flow

1. `await auth()`
2. Render `<Card width="min"><Coin seed={session?.user?.name || ''} /></Card>`

Empty seed when logged out still renders Coin (initials from empty string — see `Coin` edge behavior).

## Auth

Read-only session for display seed; no gate.

---

**Sources:** `src/app/coins/page.tsx`