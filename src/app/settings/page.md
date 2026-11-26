---
title: Settings page
description: Client preferences UI backed by UserPreferencesContext
---

# Settings page (`/settings`)

`'use client'` preferences surface wrapped in `SettingsCopyProvider` (see module export at file end).

## Copy

`SettingsPageContent` uses `useSettingsCopy()` + expandable categories keyed by `SettingsEnCopy['categories']` with `SiteIcon` per row.

## Session

`useSession()` — some controls disabled or hidden when `status !== 'authenticated'` (account-linked prefs).

## UserPreferencesContext hooks

Wires read/write for:

- Spacing theme, pagination mode, emoji panel behavior, font preference
- Accessibility focus mode
- Background movement direction/speed, animation layers
- Ambient audio reactivity percent

Each preference exposes `isUpdating*` and `*Error` flags from context for inline status.

## Feature components

- `SubscriptionFlairToggle` — flair visibility preference
- `useFlairPreference`, `useProfileVisibility` for profile-related toggles

## Structure

Accordion categories (`SettingsCategory` local state `expanded`), form controls in `settings.css`.

## Side effects

Preference mutations persist via context (server sync patterns in `@lib/context/UserPreferencesContext` — not in this file).

---

**Sources:** `src/app/settings/page.tsx`, `src/app/settings/SettingsCopyContext.tsx`