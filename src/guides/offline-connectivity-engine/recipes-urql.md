---
title: OCE recipe — urql
description: urql Client with OCE.fetch on exchanges
---

# Recipe — urql

**[urql](https://nearform.com/open-source/urql/)** accepts a custom **`fetch`** on `createClient`.

## Client

```tsx
import { Client, Provider, cacheExchange, fetchExchange } from 'urql';
import { OCE } from '@lib/oce';

const client = new Client({
  url: '/graphql',
  fetch: OCE.fetch,
  fetchOptions: () => ({
    credentials: 'include',
  }),
  exchanges: [cacheExchange, fetchExchange],
});

export function UrqlProvider({ children }: { children: React.ReactNode }) {
  return <Provider value={client}>{children}</Provider>;
}
```

GraphQL HTTP round trips settle OCE automatically.

## Mutations

```tsx
import { useMutation } from 'urql';

const [, save] = useMutation(SaveProfileMutation);

// Always run — do not guard on OCE unavailable
await save({ input: payload });
```

## `fetchOptions` vs `fetch`

- **`fetch`** — replace the implementation (`OCE.fetch`).
- **`fetchOptions`** — per-request init (credentials, headers).

Do not substitute plain `fetch` inside a custom exchange unless you call `reporter` yourself.

## Forbidden

```ts
// Custom exchange that calls global fetch
import { pipe, map } from 'wonka';

const badExchange = ({ forward }) =>
  (ops$) => pipe(ops$, map((op) => {
    return fetch(op.context.url); // not observed
  }));
```

---

**Related:** [Recipes index](/guides/offline-connectivity-engine/recipes-index) · [Apollo](/guides/offline-connectivity-engine/recipes-apollo)