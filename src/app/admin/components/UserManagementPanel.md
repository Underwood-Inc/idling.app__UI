---
title: UserManagementPanel (legacy re-export)
description: Back-compat barrel pointing at modular UserManagementPanel
---

# UserManagementPanel (shim)

This file only **re-exports** the refactored panel:

```typescript
export { UserManagementPanel } from './UserManagementPanel/UserManagementPanel';
```

Import `@/app/admin/components/UserManagementPanel` or the folder `index.ts` for the full module surface (hooks, types, subcomponents).

---

**Sources:** `src/app/admin/components/UserManagementPanel.tsx`, `src/app/admin/components/UserManagementPanel/UserManagementPanel.tsx`