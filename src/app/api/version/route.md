---
title: GET /api/version
description: Application semver from package.json
---

# GET /api/version

Public JSON version string for deploy checks and client compatibility.

## Handler

- **Dynamic:** `force-dynamic`
- **Method:** `GET` via `withUniversalEnhancementsNoRateLimit(versionHandler)` — no rate limit wrapper.

## Response

```json
{ "version": "<semver from package.json>" }
```

Implementation reads `package.json` with `require('../../../../package.json')` inside `versionHandler` (avoids static import warnings per file comment).

OpenAPI annotations live in the route file (`@swagger` block).

---

**Sources:** `src/app/api/version/route.ts`, root `package.json` `version` field