---
title: Game page
description: Feature-flagged redirect; GameWrapper unreachable in production
---

# Game page (`/game`)

## Current behavior

`const isDisabled = true` — always `redirect('/')` before render.

Dead code path (kept for future enable): would render `GameWrapper` inside `article.main`.

## Exports

Default server page only.

---

**Sources:** `src/app/game/page.tsx`