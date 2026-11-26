---
title: RadioPlayerLocaleSection
description: Language picker subsection inside the radio settings panel
category: component
---

# RadioPlayerLocaleSection

Settings panel block that exposes the same locale picker as the site footer, scoped to radio dock styling.

## Exports

- `RadioPlayerLocaleSection` — no props

## Render

1. Wrapper `div` with `RadioPlayerBar.module.css` → `panelSection`, `data-testid="radio-settings-language"`.
2. Section title: `ll.locale.pickerLabel()` from `useIdlingLocale()`.
3. **`LocalePicker`** with `className="locale-picker--radio-panel"` and `showVisibleLabel={false}` (label is the `h2` only).

## Behavior

Changing locale uses the shared `LocalePicker` implementation: updates locale id, persists cookie/localStorage, and refreshes typesafe-i18n catalogs — including `useRadioCopy()` strings on the bar. Does **not** change route segments (no locale-prefixed URLs).

---

**Sources:** `src/app/components/radio-player/RadioPlayerLocaleSection.tsx`, `src/app/components/radio-player/RadioPlayerBar.module.css`, `src/app/components/locale/LocalePicker.tsx`, `src/app/components/locale/IdlingLocaleProvider.tsx`