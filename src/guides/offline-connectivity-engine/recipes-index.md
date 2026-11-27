---
title: OCE framework recipes
description: Wire OCE into the ten most common browser HTTP stacks — one observed fetch at the bottom
sidebar_position: 2
---

# Framework recipes

**In plain terms:** OCE learns from **real network attempts**. Point each library’s **`fetch`** (or equivalent) at **`OCE.fetch`**. If the stack cannot use `fetch`, use **`OCE.reporter`** at the lowest layer.

**Idling.app entry:** `import { OCE } from '@lib/oce'`.

| # | Stack | Recipe | Integration surface |
|---|-------|--------|-------------------|
| 1 | **Native `fetch`** | [Fetch](/guides/offline-connectivity-engine/recipes-fetch) | `OCE.fetch` |
| 2 | **[Axios](https://axios-http.com/)** | [Axios](/guides/offline-connectivity-engine/recipes-axios) | `adapter: 'fetch', fetch: OCE.fetch` or interceptors → `reporter` |
| 3 | **[TanStack Query](https://tanstack.com/query)** | [TanStack Query](/guides/offline-connectivity-engine/recipes-tanstack-query) | `queryFn` calls `OCE.fetch`; `networkMode: 'always'` for user work |
| 4 | **[SWR](https://swr.vercel.app/)** | [SWR](/guides/offline-connectivity-engine/recipes-swr) | Global `fetcher` → `OCE.fetch` |
| 5 | **[Apollo Client](https://www.apollographql.com/docs/react/)** | [Apollo](/guides/offline-connectivity-engine/recipes-apollo) | `HttpLink` `fetch: OCE.fetch` |
| 6 | **[RTK Query](https://redux-toolkit.js.org/rtk-query/overview)** | [RTK Query](/guides/offline-connectivity-engine/recipes-rtk-query) | `fetchBaseQuery({ fetchFn: OCE.fetch })` |
| 7 | **[ky](https://github.com/sindresorhus/ky)** | [ky](/guides/offline-connectivity-engine/recipes-ky) | `ky.create({ fetch: OCE.fetch })` |
| 8 | **[ofetch](https://github.com/unjs/ofetch)** | [ofetch](/guides/offline-connectivity-engine/recipes-ofetch) | `ofetch.create({ fetch: OCE.fetch })` |
| 9 | **[urql](https://nearform.com/open-source/urql/)** | [urql](/guides/offline-connectivity-engine/recipes-urql) | `fetch` option on `createClient` |
| 10 | **[tRPC](https://trpc.io/)** | [tRPC](/guides/offline-connectivity-engine/recipes-trpc) | `httpBatchLink({ fetch: OCE.fetch })` |

## Shared rules

1. **Every user-initiated request** that should update connectivity must hit **`OCE.fetch`** (or `reporter`).
2. **Never** gate requests on `useOceUnavailable()` — hints only.
3. **Never** wire TanStack `onlineManager` to OCE’s `unavailable` flag (deadlock).
4. Data libraries **own cache/retry**; OCE **only** watches whether requests **got a response**.

## When you are not using `fetch`

XHR-only, `<audio>`/`<video>`, WebSockets, Electron `net`, Capacitor native HTTP → [Reporter](/guides/offline-connectivity-engine/reporter).

## Start here

[Getting started](/guides/offline-connectivity-engine/getting-started) · [Attach fetch](/guides/offline-connectivity-engine/attach-fetch)