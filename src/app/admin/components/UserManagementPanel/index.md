---
title: UserManagementPanel index
description: Public exports for the user management module
---

# UserManagementPanel module index

Barrel re-export surface:

| Export | Kind |
|--------|------|
| `UserManagementPanel` | main component |
| `FilterPanel`, `HeaderSection`, `PaginationSection`, `UserTable` | subcomponents |
| `export type *` from `./types` | types |
| `export *` from `./constants`, `./utils`, `./hooks`, `./components` | config, helpers, hooks, UI cells |

Prefer importing from this index when consuming multiple panel pieces from outside the folder.

---

**Sources:** `src/app/admin/components/UserManagementPanel/index.ts`