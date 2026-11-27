---
title: OCE recipe — RTK Query
description: fetchBaseQuery with OCE.fetch and non-blocking mutations
---

# Recipe — RTK Query

**[RTK Query](https://redux-toolkit.js.org/rtk-query/overview)** uses `fetchBaseQuery` (wrapper around `fetch`). Pass **`fetchFn: OCE.fetch`**.

## API slice

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { OCE } from '@lib/oce';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
    fetchFn: OCE.fetch,
  }),
  endpoints: (build) => ({
    getProfile: build.query<Profile, void>({
      query: () => '/profile',
    }),
    saveProfile: build.mutation<void, Partial<Profile>>({
      query: (body) => ({
        url: '/profile',
        method: 'PUT',
        body,
      }),
    }),
  }),
});

export const { useGetProfileQuery, useSaveProfileMutation } = api;
```

Every query/mutation uses the same observed `fetch`.

## UI hints

```tsx
import { useOceUnavailable } from '@lib/oce';

export function ProfilePage() {
  const unavailable = useOceUnavailable();
  const { data, isFetching, refetch } = useGetProfileQuery();

  return (
    <>
      {unavailable ? (
        <p role="status">Connection may be unstable — you can still save.</p>
      ) : null}
      {/* Do not skip refetch or disable mutate when unavailable */}
      <button type="button" onClick={() => refetch()} disabled={isFetching}>
        Refresh
      </button>
    </>
  );
}
```

## Retries

RTK Query retries are configured on the endpoint or `baseQuery`. Each retry re-enters `fetchFn` — keep **`OCE.fetch`** so failures count toward OCE streaks.

## Forbidden

```ts
// Forbidden — custom baseQuery that bypasses OCE
baseQuery: async (args) => {
  const res = await fetch(args.url); // not observed
  return { data: await res.json() };
},
```

---

**Related:** [Recipes index](/guides/offline-connectivity-engine/recipes-index) · [Reporter](/guides/offline-connectivity-engine/reporter)