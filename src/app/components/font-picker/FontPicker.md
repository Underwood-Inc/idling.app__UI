---
title: FontPicker
description: User font family preference dropdown
---

# FontPicker

Client dropdown to persist `monospace` vs `default` reading font via `useFontPreference`.

## Exports

- `FontPicker` — named and default export
- `FontOption` — `'monospace' | 'default'`
- Internal `FONT_OPTIONS` catalog: Code (Fira Code) vs Reading (system stack)

## Props (`FontPickerProps`)

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `className` | `string` | `''` | On root `font-picker` |
| `onChange` | `(font: FontOption) => void` | — | Called after successful `setPreference` |

## Behavior

- Returns `null` until client mount (avoids hydration mismatch).
- Trigger: listbox pattern, keyboard Enter/Space/Escape, `aria-haspopup`, disabled while `isUpdating`.
- Options show name, description, live `fontFamily` preview; checkmark on selected.
- Click-outside closes dropdown (`mousedown` on document).

---

**Sources:** `src/app/components/font-picker/FontPicker.tsx`, `src/app/components/font-picker/FontPicker.css`, `@lib/context/UserPreferencesContext`