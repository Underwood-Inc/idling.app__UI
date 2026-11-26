---
title: AppVersion
description: Footer link showing package version from GET /api/version
---

# AppVersion

Default export client component that displays the deployed app version and links to the GitHub repo.

## Props

- `className?: string` — applied to placeholder span or anchor.

## HTTP

On mount, `fetch('/api/version')` → JSON `{ version }`. Success sets displayed version; network/parse failure sets `'ERROR'`. Initial state is `'0.0.0'`.

## Hydration

Until `mounted` is true, renders `<span className={className}>v0.0.0</span>` (no link) to avoid layout shift.

After mount: anchor with `href="https://github.com/Underwood-Inc/idling.app__UI"`, `target="_blank"`, `data-testid` from `APP_VERSION_SELECTORS.ANCHOR`, body `v{version}`.

## Edge cases

- Does not abort fetch on unmount; cleanup only flips `mounted` (legacy pattern in source).
- No authentication on `/api/version` (see `src/app/api/version/route.ts`).

---

**Sources:** `src/app/components/app-version/AppVersion.tsx`, `src/app/api/version/route.ts`