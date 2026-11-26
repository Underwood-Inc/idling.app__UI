---
title: AdminUserTooltip
description: Inline hover control to inspect timeout status and issue user timeouts
---

# AdminUserTooltip

Client component for embedding admin timeout controls next to a username in admin surfaces.

## Props

| Prop | Role |
|------|------|
| `userId` | Numeric user id for API calls |
| `username` | Display label on the trigger |
| `onTimeoutUser` | Parent handler `(userId, timeoutType, reason, durationHours)` after form submit |

## Behavior

- Trigger opens tooltip on hover/click; tooltip stays open while the timeout form is visible.
- On first open, `GET /api/admin/users/timeout?userId=&type=general` loads current timeout status.
- Shows normal vs timed-out state with reason and remaining time (`formatTimeRemaining`).
- **Issue Timeout** opens inline form: type (`emoji_submission`, `rate_limit`, `general`, `full_access`), duration hours (1–8760), required reason textarea.
- Submit delegates to `onTimeoutUser`; clears tooltip and refetches status on success.
- Disabled when user is already timed out.

## Styling

`AdminUserTooltip.css` — BEM classes `admin-user-tooltip__*`.

---

**Sources:** `src/app/admin/components/AdminUserTooltip.tsx`, `src/app/admin/components/AdminUserTooltip.css`