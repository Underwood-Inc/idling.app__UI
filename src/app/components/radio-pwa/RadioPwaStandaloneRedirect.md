---
title: RadioPwaStandaloneRedirect
description: Keeps installed PWA on radio start path
---

# RadioPwaStandaloneRedirect

When `isStandalonePwa()` is true and `pathname` differs from `IDLING_RADIO_PWA_START_PATH`, calls `router.replace` to the start path. No UI output.

---

**Sources:** `src/app/components/radio-pwa/RadioPwaStandaloneRedirect.tsx`, `@lib/radio-pwa/constants`