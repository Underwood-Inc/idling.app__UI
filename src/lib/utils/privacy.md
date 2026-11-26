---
title: privacy
description: Server-side profile visibility checks for API routes
---

# privacy

Enforces public vs private user profiles before returning `UserProfileData`.

## `PrivacyCheckResult`

| Field | Meaning |
| ----- | ------- |
| `allowed` | Viewer may see the profile |
| `profile` | Loaded row when allowed |
| `error` | Message when denied |
| `statusCode` | 404, 403, or 500 |

## Functions

- **`checkProfilePrivacyById(profileId)`** — Load by database id via `getUserProfileByDatabaseId`.
- **`checkProfilePrivacyByUserId(userId)`** — Load by user id via `getUserProfileById`.
- **`withProfilePrivacy(identifier, isUserId?)`** — Returns a ready `Response` JSON error or `{ profile }` for route handlers.

## Rules

1. Missing profile → 404.
2. `profile_public !== false` → allowed for everyone.
3. Private profile → allowed only when session user id matches profile owner id (string compare).
4. Uncaught errors → 500.

Uses `auth()` from `@/lib/auth` for the current session.

---

**Sources:** `src/lib/utils/privacy.ts`, `src/lib/actions/profile.actions.ts`