---
title: LocalePicker
description: Footer language select bound to Idling locale context
---

# LocalePicker

Client `<select>` for choosing display language from the locale catalog.

## Exports

- `LocalePicker` — named export
- `LocalePickerProps` — interface

## Props (`LocalePickerProps`)

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `className` | `string` | — | Merged onto root `locale-picker` label |
| `showVisibleLabel` | `boolean` | `false` | Visible **Language** label vs SR-only aria text |

## Behavior

- `useIdlingLocale()` supplies `catalog`, `localeId`, `setLocaleId`, `ll`, `loading`.
- Select disabled while `loading`; `onChange` casts value to `IdlingLocaleId`.
- Aria/label strings from `ll.locale.pickerAria` / `pickerLabel` with English fallbacks.

---

**Sources:** `src/app/components/locale/LocalePicker.tsx`, `src/app/components/locale/LocalePicker.css`, `src/app/components/locale/IdlingLocaleProvider.tsx`, `@molecules/quotes/idlingLocaleCatalog`