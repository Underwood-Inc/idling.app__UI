---
title: 'IdlingLocaleProvider'
description: 'Client locale context for typesafe-i18n site chrome'
category: component
---

# IdlingLocaleProvider

**What this does:** mounts **typesafe-i18n** for idling.app client UI — English boots synchronously on first paint; other locales load asynchronously when the player picks a language in the footer (or from `localStorage` / cookie), without blocking the app shell.

## Context API

`useIdlingLocale()` returns:

| Field | Meaning |
| ----- | ------- |
| `localeId` | Active `IdlingLocaleId` from canon catalog |
| `ll` | Translation function object (`TranslationFunctions`) |
| `loading` | `true` while a non-English chunk fetches |
| `setLocaleId` | Persists to storage + cookie, kicks off `loadLocaleAsync` |
| `catalog` | `IDLING_LOCALE_CATALOG` rows for picker labels |

## Boot sequence

1. **`initIdlingI18n(IDLING_BASE_LOCALE)`** runs immediately — first paint uses English `ll`.
2. On mount, **`resolveIdlingLocaleFromStorage()`** may schedule a deferred locale if the user previously chose one (`idling-ui-locale` key).
3. **`loadLocaleAsync`** imports the locale module; on success, context updates and `writeIdlingLocaleCookie` runs for future metadata experiments.
4. **Tests** short-circuit to `testLocaleContext()` — no async locale fetch in Vitest.

Policy matches Mappy site: **no** auto-switch from browser `Accept-Language` alone. See [/guides/i18n](/guides/i18n) and [/guides/i18n-ssr-metadata](/guides/i18n-ssr-metadata).

## Usage

```tsx
import { IdlingLocaleProvider, useIdlingLocale } from '@app/components/locale/IdlingLocaleProvider';

// In root client shell (SiteChromeProviders)
<IdlingLocaleProvider>{children}</IdlingLocaleProvider>;

function Example() {
  const { ll, localeId } = useIdlingLocale();
  return <span>{ll.common.backHome()}</span>;
}
```

Area-specific copy providers (admin, settings, tools) may wrap subtrees with catalogs resolved from `ll` — see `resolveCatalogFromLl` molecule.

## Integration

| Module | Role |
| ------ | ---- |
| `$i18n/idling-i18n` | Sync English seam, same shape as Mappy `mappy-i18n` |
| `@molecules/quotes/idlingLocaleCatalog` | Canon locale list |
| `writeIdlingLocaleCookie` | Footer picker persistence |

## Failure modes

| Symptom | Cause |
| ------- | ----- |
| Flash of English then switch | Expected when stored locale ≠ EN |
| Stuck English | Locale chunk failed — check network tab for dynamic import |
| Hook throws | Provider missing above component tree |