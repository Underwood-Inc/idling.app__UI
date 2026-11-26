---
title: User profile page
description: Numeric user ID profile with privacy gate and rich embeds
---

# Profile page (`/profile/[username]`)

Dynamic segment name is legacy; **only numeric database IDs** are accepted post-migration 0010.

## Routing guard

`decodeURIComponent(username)` must match `/^\d+$/` — otherwise `notFound()` (no username lookup).

## Data

- `getUserProfileByDatabaseId(decodedUsername)` server action
- `auth()` for session compare → `isOwnProfile`
- Private profiles (`profile_public === false`) blocked for non-owners with dedicated private UI (not 404)

## Client island

`ProfilePageClient` handles interactive profile editing/viewing; server page prepares SEO/social metadata via `resolveProfileCopy`, YouTube/embed extraction (`social-sharing` utils).

## Layout pieces

Uses `PageContainer`, `PageAside`, `PageContent`, `Card`, `FadeIn`, `InstantLink`, profile SCSS.

## Edge cases

ID comparison uses string coercion on both session and profile ids. Invalid/non-numeric paths 404 by design.

---

**Sources:** `src/app/profile/[username]/page.tsx`, `@lib/actions/profile.actions`