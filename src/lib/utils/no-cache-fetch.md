---
title: no-cache-fetch
description: fetch wrapper that bypasses browser and CDN caching
---

# no-cache-fetch

Drop-in replacement for `fetch` on sensitive routes so permission checks cannot be satisfied from stale cached responses.

## Behavior

1. Appends `_t`, `_r`, `_nc` query params for uniqueness.
2. Merges aggressive no-cache headers (`Cache-Control`, `Pragma`, `Surrogate-Control`, etc.).
3. Sets `cache: 'no-store'` and default `credentials: 'include'`.

## Exports

- **`noCacheFetch(input, init?)`** — Primary API.
- Additional helpers in the same file mirror `fetch` patterns for GET/POST wrappers (see source).

Prefer this over raw `fetch` for auth, admin, and permission-dependent client calls.

---

**Sources:** `src/lib/utils/no-cache-fetch.ts`