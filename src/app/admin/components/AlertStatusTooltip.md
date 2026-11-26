---
title: AlertStatusTooltip
description: Interactive tooltip explaining custom alert active vs published semantics
---

# AlertStatusTooltip

Wraps admin alert status badges with an `InteractiveTooltip` that educates admins on **active** (system processing) vs **published** (user visibility).

## Props

| Prop | Role |
|------|------|
| `type` | `'active'` or `'published'` — which dimension the tooltip explains |
| `isActive` / `isPublished` | Optional current flags; when both set, shows visibility matrix |
| `children` | Trigger element (badge, icon, label) |

## Content

`getStatusInfo` supplies title, description, purpose, examples, and optional **current state** coloring (`success` / `warning` / `danger` / `info`).

When both flags are provided, **Visibility matrix** highlights the quartet: disabled draft, active draft, published inactive, and live (active + published = visible).

Uses `SiteIcon` catalog icons (`wrench`, `megaphone`, check/circleX matrix).

---

**Sources:** `src/app/admin/components/AlertStatusTooltip.tsx`, `src/app/admin/components/AlertStatusTooltip.css`, `src/app/components/tooltip/InteractiveTooltip.tsx`