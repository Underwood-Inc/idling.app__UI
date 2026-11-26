---
title: QuotaManagement
description: Per-user effective quota viewer and override editor
---

# QuotaManagement

Named export — overlay panel for a single `ManagementUser` showing **effective** limits across services/features.

## Props

`user`, `isOpen`, `onClose`, optional `onUpdate` after saves.

## Data model

`EffectiveQuotaData` merges subscription base quota, optional admin override, and resolved `effective_source` (`subscription_plan` \| `user_override` \| `none`).

Fetches and updates via admin quota APIs in component effects/handlers (see source). Supports unlimited flag, reset period edits, and override reason.

Uses `TimestampWithTooltip` for reset dates.

---

**Sources:** `src/app/admin/components/UserManagementPanel/QuotaManagement.tsx`