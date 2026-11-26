---
title: TimeoutModal
description: Structured user timeout form with presets and types
---

# TimeoutModal

Named export `TimeoutModal`; exports `TimeoutOptions` for parent API payloads.

## Props

`user` (id, name, email), `isOpen`, `onClose`, `onTimeout(userId, options)`.

## Timeout types

`emoji_submission`, `rate_limit`, `general`, `full_access` — each with admin-facing description in `TIMEOUT_TYPES`.

## Duration

Preset hours (`TIMEOUT_PRESETS` 1h → 30d) or custom days/hours/minutes when preset is **Custom**.

`COMMON_REASONS` quick-fill list; reason required on submit.

---

**Sources:** `src/app/admin/components/modals/TimeoutModal.tsx`, `src/app/admin/components/modals/TimeoutModal.css`