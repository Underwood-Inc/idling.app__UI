---
title: useLinkPreview
description: Fetches link preview JSON when URL changes
---

# useLinkPreview

`'use client'` implicit — standard React hook, no directive in file but used from client components.

## Signature

`useLinkPreview(url: string | null)`

## Return shape

```ts
{ data: LinkPreviewData | null; loading: boolean; error: string | null }
```

`LinkPreviewData`: `title`, optional `description` / `image`, `url`.

## Behavior

- `url === null` → clears data, loading false, error null (no request)
- On `url` change: sets loading, **GET** `/api/link-preview?url=${encodeURIComponent(url)}` via `noCacheFetch`
- `!response.ok` → thrown as `'Failed to fetch preview'`
- `useEffect` cleanup sets `isMounted = false` to avoid setState after unmount

## Side effects

Network only; no localStorage.

---

**Sources:** `src/app/hooks/useLinkPreview.ts`