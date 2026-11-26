---
title: PillInput
description: Click-to-edit field that renders hashtags and structured mentions as pills
---

# PillInput

Controlled string input that displays `#tags` and `@[username|userId]` segments via `ContentWithPills` until the user clicks to edit raw text.

## Props (`PillInputProps`)

| Prop | Notes |
|------|-------|
| `value` / `onChange` | Controlled string |
| `contextId` | Passed to nested `ContentWithPills` |
| `onHashtagClick` / `onMentionClick` | Pill interaction in display mode |
| `placeholder`, `disabled`, `className` | Standard field chrome |

## Editing

Click container → inline `<input>`; Enter commits, Escape cancels, blur commits. Outside click commits. Parser regex: `/#\w+/` and `/@\[[^\]]+\]/`.

---

**Sources:** `src/app/components/ui/PillInput.tsx`, `src/app/components/ui/ContentWithPills.tsx`