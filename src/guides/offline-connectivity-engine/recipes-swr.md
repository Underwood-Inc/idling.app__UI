---
title: OCE recipe — SWR
description: fetcher wiring, shouldRetryOnError, refreshInterval, and OCE non-blocking hints
---

# Recipe — SWR

**In plain terms:** SWR `shouldRetryOnError` and `onErrorRetry` **continue** polling after errors. That is good only if the fetcher actually calls `fetchWithOce`.

## Global fetcher

```tsx
import useSWR, { SWRConfig } from 'swr';
import { fetchWithOce } from '../oce-bootstrap';

async function swrFetcher<T>(url: string): Promise<T> {
  const response = await fetchWithOce(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher: swrFetcher }}>{children}</SWRConfig>
  );
}

export function useUser() {
  return useSWR<User>('/api/me');
}
```

## Retries

```tsx
useSWR('/api/feed', {
  shouldRetryOnError: true,
  onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
    if (retryCount >= 3) return;
    setTimeout(() => revalidate({ retryCount }), 1000 * 2 ** retryCount);
  },
});
```

Each `revalidate` re-runs the fetcher → must use `fetchWithOce`.

## Do not zero `refreshInterval` when unavailable

```tsx
// Forbidden — stops traffic that would clear the flag
const unavailable = useOceUnavailable();
useSWR('/api/status', {
  refreshInterval: unavailable ? 0 : 30_000,
});
```

Keep interval stable; show a hint instead:

```tsx
useSWR('/api/status', { refreshInterval: 30_000 });
```

## Forbidden fetcher swallow

```ts
// Forbidden
const fetcher = async (url: string) => {
  try {
    return await fetchWithOce(url).then((r) => r.json());
  } catch {
    return undefined; // OCE saw failure, but UI pretends success forever
  }
};
```

If you must return a fallback, **rethrow** after showing UI, or report explicitly before returning.

## Custom fetcher with reporter (non-fetch stack)

```ts
import useSWR from 'swr';
import { getPageConnectivityEngine } from '@strixun/api-framework/connectivity';

async function xhrFetcher(url: string) {
  try {
    const data = await xhrGet(url);
    getPageConnectivityEngine().reporter.reportResponse({ url });
    return data;
  } catch (error) {
    const engine = getPageConnectivityEngine();
    if (isAbort(error)) engine.reporter.reportIgnored();
    else engine.reporter.reportTransportFailure({ url });
    throw error;
  }
}

useSWR('/api/legacy', xhrFetcher);
```

## Hint component alongside data

```tsx
export function FeedPanel() {
  const { data, error, isLoading } = useSWR('/api/feed');
  return (
    <>
      <OceStatusBanner />
      {isLoading ? <Spinner /> : null}
      {error ? <ErrorText message={error.message} /> : null}
      {data ? <Feed items={data} /> : null}
    </>
  );
}
```

Buttons stay enabled — see [React](/guides/offline-connectivity-engine/react).

---

**Sources (specified):** OCE plan — SWR recipe, refreshInterval rule, FR-OCE-010.