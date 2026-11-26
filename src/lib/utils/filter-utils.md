---
title: filter-utils
description: Toggle tag and mention filters consistently with URL sync
---

# filter-utils

Shared click handlers for list filters (`Filter` = `{ name, value }`) used with `useSimpleUrlFilters`.

## Functions

| Function | Behavior |
| -------- | -------- |
| `handleTagFilter` | Toggle `tags` filter; strips `#` for compare; drops `tagLogic` when ≤1 tag; optional atomic `updateUrl` |
| `handleMentionFilter` | Toggle `mentions` / author-style filters |
| `isTagActive` / `isMentionActive` | Membership checks with normalization |

Tag removal uses a single computed filter array when `updateUrl` is passed to avoid partial URL state in development (debug `console.log` only in `NODE_ENV === 'development'`).

---

**Sources:** `src/lib/utils/filter-utils.ts`