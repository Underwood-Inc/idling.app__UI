---
title: Home page
description: App root route rendering marketing landing inside site chrome
---

# Home page (`/`)

Server Component route module for the site root.

## Exports

| Export | Role |
|--------|------|
| `metadata` | From `buildHomePageMetadata()` (`@molecules/i18n/idlingMeta`) — static SEO/i18n title and description |
| default `Home` | Page component |

## Render tree

Wraps `HomeLanding` in `PageContainer` (shared page width/chrome padding). No client boundaries in this file; landing interactivity lives in `HomeLanding`.

## Auth and data

No session check on this route. No `dynamic` / `revalidate` exports — follows Next defaults for this segment.

## Key imports

- `HomeLanding` — primary marketing/content
- `PageContainer` — layout shell for app pages

---

**Sources:** `src/app/page.tsx`