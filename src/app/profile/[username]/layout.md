---
title: Profile layout
description: Pass-through layout wrapper for profile routes
---

# Profile layout

Minimal Next.js layout for `/profile/[username]/**`.

## Props

`children: React.ReactNode`

## Behavior

Fragment wrapper only (`<>{children}</>`) — no shared chrome, metadata, or auth at this segment.

Profile-specific styling lives on `page.tsx` / client components.

---

**Sources:** `src/app/profile/[username]/layout.tsx`