---
title: auth-avatar (barrel)
description: Client AuthAvatar export; server component imported by path
---

# auth-avatar / index

## Exports

- `AuthAvatar` from `./AuthAvatar`

## Not exported

`AuthAvatarServer` is server-only (`@lib/auth`). Import explicitly:

```ts
import { AuthAvatarServer } from '../auth-avatar/AuthAvatarServer';
```

(Comment in barrel documents this constraint.)

---

**Sources:** `src/app/components/auth-avatar/index.ts`