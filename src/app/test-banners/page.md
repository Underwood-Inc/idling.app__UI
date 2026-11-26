---
title: Test Banners page
description: Dev route exercising banner notifications and rate limits
---

# Test Banners (`test-banners/page.tsx`)

Client-only QA page for the global banner system.

## Behavior

Maintains `testResults` log (`timestamp`, `SiteIconId`, message). Buttons trigger scenarios such as:

- Rate limit notification fetch/display.
- Success, warning, error, and info banner paths (see full component for API endpoints and `window` hooks used).

`FeatureListItem` renders checklist rows with `SiteIcon`. Intended for local/staging manual verification—not linked from production nav.

---

**Sources:** `src/app/test-banners/page.tsx`