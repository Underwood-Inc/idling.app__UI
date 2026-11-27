---
title: OCE recipe — ky
description: ky instance with custom fetch for OCE settlements
---

# Recipe — ky

**[ky](https://github.com/sindresorhus/ky)** is a small `fetch` wrapper. Override **`fetch`** on the instance.

## Shared client

```ts
import ky from 'ky';
import { OCE } from '@lib/oce';

export const api = ky.create({
  prefixUrl: '/api',
  credentials: 'include',
  fetch: OCE.fetch,
});

export type KyInstance = typeof api;
```

## Usage

```ts
const profile = await api.get('profile').json<Profile>();

await api.post('settings', { json: payload });
```

All ky HTTP verbs delegate to `OCE.fetch`.

## Hooks / SSR

Create the ky instance once per browser module (idling: import `api` from a `lib/http/ky.ts` client module). Do not recreate per render.

## Errors

ky throws `HTTPError` when `!response.ok`. OCE still recorded a **`Response`** — the server answered even for 4xx/5xx.

Failed connections (no response) throw `TypeError` / network errors → OCE streak.

## Forbidden

```ts
// Forbidden — default global ky without OCE.fetch
import ky from 'ky';
await ky.get('/api/foo'); // not observed
```

---

**Related:** [Recipes index](/guides/offline-connectivity-engine/recipes-index)