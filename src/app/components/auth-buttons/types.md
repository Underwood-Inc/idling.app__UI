---
title: auth-buttons types
description: Allowed OAuth provider identifiers for sign-in buttons
---

# auth-buttons / types

## Exports

```ts
export type SignInProviders = 'twitch' | 'google';
```

Used by `AuthButtons`, `ClientAuthButtons`, and `signInAction`. No runtime values — type-only module.

Adding a provider requires NextAuth config alignment and UI copy updates in both server and client button components.

---

**Sources:** `src/app/components/auth-buttons/types.ts`