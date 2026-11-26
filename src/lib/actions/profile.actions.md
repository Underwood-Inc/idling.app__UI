---
title: profile.actions
description: Profile read/update server actions
---

# profile.actions

`'use server'`. Types: `ProfileFilters`, maps to `UserProfileData`.

## Reads

- `getUserProfileByDatabaseId(id)` — primary path; loads `users` + `accounts`, returns prefs (`spacing_theme`, `pagination_mode`, `emoji_panel_behavior`, `font_preference`, `flair_preference`)
- `getUserProfileById` — alternate lookup (see source for identifier rules)
- `getUserProfile` — **deprecated**; numeric IDs delegate to database ID helper
- `searchUsers` — admin/search listing with filters

## Writes

- `updateUserProfile` — field updates with validation
- `updateUserPreferencesAction` / `updateBioAction` — focused mutations; `revalidatePath` on profile routes

Uses `getEffectiveCharacterCount` for bio limits. Logger: `ProfileActions`.

---

**Sources:** `src/lib/actions/profile.actions.ts`