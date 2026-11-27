---
title: OCE recipe — Apollo Client
description: HttpLink fetch, errorPolicy, and networkError classification for OCE
---

# Recipe — Apollo Client

**In plain terms:** `errorPolicy` changes what the UI sees, not what the socket did. Observation belongs on `HttpLink` (or your transport) via `attachFetch` or `reporter`.

## HttpLink with `fetchWithOce`

```tsx
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { fetchWithOce } from '../oce-bootstrap';

const link = new HttpLink({
  uri: '/graphql',
  credentials: 'same-origin',
  fetch: fetchWithOce,
});

export const apollo = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
```

With this wiring, `attachFetch` classifies every GraphQL HTTP round trip automatically.

## `errorPolicy` matrix

| Policy | What the app sees | OCE requirement |
| ------ | ----------------- | --------------- |
| `none` (default) | Promise rejects, `error` set | Transport ran via `fetchWithOce` |
| `all` | Resolves with `data` and `error` | Same — resolved promise ≠ no HTTP |
| `ignore` | Errors dropped for rendering | **Not** allowed to skip `HttpLink` |

`errorPolicy: 'ignore'` is allowed for UI. It is **not** allowed to skip performing the HTTP call.

## `onError` link — split `networkError`

Apollo's `networkError` covers transport failure **and** non-200 HTTP (`ServerError`). Split before reporting:

```tsx
import { onError } from '@apollo/client/link/error';
import { getPageConnectivityEngine } from '@lib/oce/connectivity';

const errorLink = onError(({ networkError }) => {
  if (!networkError) return;
  const engine = getPageConnectivityEngine();
  const code =
    'statusCode' in networkError
      ? (networkError as { statusCode?: number }).statusCode
      : undefined;
  if (code != null) {
    engine.reporter.reportResponse();
  } else {
    engine.reporter.reportTransportFailure();
  }
  // do not return forward() solely to hide failure from OCE
});
```

Use `attachFetch` on `HttpLink` when possible — then `onError` reporting is redundant unless you have split links.

## User mutation (non-blocking)

```tsx
import { gql, useMutation } from '@apollo/client';
import { ConnectivityHint } from './ConnectivityHint';

const SAVE = gql`
  mutation Save($input: SaveInput!) {
    save(input: $input) {
      ok
    }
  }
`;

export function SaveButton() {
  const [save, { loading }] = useMutation(SAVE, { errorPolicy: 'none' });

  return (
    <>
      <ConnectivityHint />
      <button
        type="button"
        disabled={loading}
        onClick={() => save({ variables: { input: { id: '1' } } })}
      >
        Save
      </button>
    </>
  );
}
```

**Do not** add `disabled={snapshot.unavailable}`.

## Forbidden

```tsx
// Forbidden — skip HttpLink when flag set
const snap = getPageConnectivityEngine().getSnapshot();
if (snap.unavailable) {
  return { data: cachedQuery };
}
return apollo.query({ query: MY_QUERY });
```

---

**Sources (specified):** OCE plan — Apollo recipe, errorPolicy table, networkError split, FR-OCE-010.