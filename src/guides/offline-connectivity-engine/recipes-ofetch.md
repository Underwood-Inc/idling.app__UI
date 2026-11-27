---
title: OCE recipe — ofetch
description: ofetch / $fetch with OCE.fetch (Nuxt, unjs, Nitro clients)
---

# Recipe — ofetch

**[ofetch](https://github.com/unjs/ofetch)** powers Nuxt `$fetch` and many UnJS stacks. Use **`ofetch.create`** with a custom **`fetch`**.

## Client module

```ts
import { ofetch, type $Fetch } from 'ofetch';
import { OCE } from '@lib/oce';

export const $api: $Fetch = ofetch.create({
  baseURL: '/api',
  credentials: 'include',
  fetch: OCE.fetch,
});
```

## Calls

```ts
const user = await $api<User>('/me');
await $api('/settings', { method: 'PUT', body: payload });
```

## Nuxt note

In Nuxt 3, prefer a plugin that exports `$api` with `OCE.fetch` for **client-side** calls that should inform idling toasts. Server `useFetch` during SSR may use server fetch — OCE is **browser-oriented** on idling.app; do not expect SSR routes to drive client snapshot.

## Retries

`ofetch` retry hooks re-issue requests — ensure the configured `fetch` remains **`OCE.fetch`**.

---

**Related:** [Recipes index](/guides/offline-connectivity-engine/recipes-index)