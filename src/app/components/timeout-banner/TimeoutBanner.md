---
title: TimeoutBanner
description: Session timeout countdown from API response wrappers
---

# TimeoutBanner

Default export client banner for moderated accounts. When authenticated, inspects API responses (via global fetch wrapper / session utilities in-file) for `is_timed_out`, `expires_at`, and reason instead of polling a dedicated timeout endpoint.

Shows countdown (`days`, `hours`, `minutes`, `seconds`) until expiry, admin-oriented user info when present, and hides when not timed out or while loading.

---

**Sources:** `src/app/components/timeout-banner/TimeoutBanner.tsx`