---
title: withValidation
description: HOF for API route auth and permission gates
---

# withValidation

Wraps route handlers with `ValidationConfig`:

- `requireAuth` (default true) — `auth()` session
- `requireUserExists` — `validateUserExistence`
- `requirePermission` — `validateUserPermission`
- `allowedMethods` — **405** when method not listed

Augments request as `ValidatedRequest` with resolved `user` + `session` before calling handler.

Use alongside or instead of `withUniversalEnhancements` where lighter validation is enough.

---

**Sources:** `src/lib/api/withValidation.ts`