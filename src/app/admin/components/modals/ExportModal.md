---
title: ExportModal
description: Export user records as CSV, HTML, Markdown, or JSON
---

# ExportModal

Client modal for bulk or single-user exports.

## Props

`users` full list, optional `selectedUser` for scoped export, `isOpen` / `onClose`.

## Options

- **Scope:** `all` \| `current` \| `selected`
- **Format:** `csv` \| `html` \| `markdown` \| `json` (`EXPORT_FORMATS` with `SiteIcon` labels)

Builds downloadable blobs client-side from in-memory user rows (roles, subscriptions, timeout fields included). Styled via `ExportModal.css`.

---

**Sources:** `src/app/admin/components/modals/ExportModal.tsx`, `src/app/admin/components/modals/ExportModal.css`