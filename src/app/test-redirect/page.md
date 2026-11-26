---
title: Test Redirect page
description: Dev route for OG image API redirect versus direct image
---

# Test Redirect (`test-redirect/page.tsx`)

Client page with two buttons opening new tabs:

| Action | URL | Expected |
|--------|-----|----------|
| Browser redirect test | `/api/og-image?seed=test-123` | Redirect to OG image viewer route |
| Direct API test | `/api/og-image?seed=test-123&direct=true` | Raw image response |

Documents intended behavior for content negotiation on the OG image API (browser vs direct). Tailwind utility classes for layout only.

---

**Sources:** `src/app/test-redirect/page.tsx`