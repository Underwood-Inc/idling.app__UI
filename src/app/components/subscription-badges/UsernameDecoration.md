---
title: UsernameDecoration
description: Applies CSS username flair from subscription decoration API
---

# UsernameDecoration

Wraps display name children with optional animated decoration class from server action `getUserDecoration`.

## Props

| Prop | Role |
|------|------|
| `userId` | Fetch target |
| `forceDecoration` | Admin/Story override string |
| `children` | Username text nodes |

## Behavior

Subscribes to `useFlairPreference` so preference edits refetch. Uses `useTransition` around the server action call. On error, falls back to undecorated children; loading states avoid layout shift where possible.

---

**Sources:** `src/app/components/subscription-badges/UsernameDecoration.tsx`, `@lib/actions/subscription.actions`, `@lib/context/UserPreferencesContext`