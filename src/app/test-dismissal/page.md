---
title: Test Dismissal page
description: Dev route for banner dismissal and localStorage debug
---

# Test Dismissal (`test-dismissal/page.tsx`)

Client QA for persistent banner dismissal.

## Behavior

- Reads `localStorage.dismissedAlerts` every 2s into UI state.
- Surfaces `window.__bannerDebug()` when injected by banner runtime.
- Actions: clear dismissed list via `__clearDismissedAlerts` or direct `localStorage` remove; buttons to re-fire test banners (see source).

Use to confirm dismissal keys sync with banner manager and that cleared state allows banners to reappear.

---

**Sources:** `src/app/test-dismissal/page.tsx`