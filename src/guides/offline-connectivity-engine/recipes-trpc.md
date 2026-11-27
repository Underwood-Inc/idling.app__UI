---
title: OCE recipe — tRPC
description: tRPC links with OCE.fetch for observed batch HTTP
---

# Recipe — tRPC

**[tRPC](https://trpc.io/)** HTTP links accept a custom **`fetch`**.

## Client

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/router';
import { OCE } from '@lib/oce';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch: OCE.fetch,
    }),
  ],
});
```

React Query integration (`createTRPCReact`) still uses the link’s `fetch` — configure the link once with **`OCE.fetch`**.

## React + TanStack

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import { OCE } from '@lib/oce';

export const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch: OCE.fetch,
    }),
  ],
});

// User mutations: networkMode 'always' on critical mutations (see TanStack recipe)
```

## WebSockets

tRPC subscriptions over WebSockets do not use `fetch`. Report connect/disconnect via **`OCE.reporter`** if drops should influence the hint.

## Forbidden

```ts
httpBatchLink({ url, fetch: globalThis.fetch }); // bypasses OCE
```

---

**Related:** [Recipes index](/guides/offline-connectivity-engine/recipes-index) · [TanStack Query](/guides/offline-connectivity-engine/recipes-tanstack-query)