---
title: auth.config
description: NextAuth provider and session type extensions
---

# auth.config

Exports `authConfig: NextAuthConfig` (providers: Twitch, Google — see file for full list and callbacks).

## Module augmentation

Extends `next-auth` `Session`, `User`, and `JWT` with:

- `accessToken`
- `providerAccountId`
- `spacing_theme`, `pagination_mode`

Additional exported types: `CustomSession`, `JWTWithProviderAccountId`, `UserWithProviderAccountId`.

Consumed by `auth` setup; not a route handler.

---

**Sources:** `src/auth.config.ts`