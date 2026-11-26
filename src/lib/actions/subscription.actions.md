---
title: subscription.actions
description: User decoration from subscription tier
---

# subscription.actions

`'use server'`.

## Types

- `DecorationTypes` — `enterprise-crown`, `premium-galaxy`, `pro-plasma`, `active-glow`, `trial-pulse`
- `FlairPreference` — `auto`, specific decoration, or `none`
- `UserDecorationData` — `{ decoration, loading, error? }`

## `getUserDecoration(userId)`

Deduplicated via `requestDeduplicator`. Reads `users.flair_preference`:

- `none` → no decoration
- fixed flair → verified against active/trialing `user_subscriptions` + `subscription_plans`
- `auto` → highest-tier decoration from active subscriptions

Maps plan types to decoration visuals for avatar/username flairs.

---

**Sources:** `src/lib/actions/subscription.actions.ts`