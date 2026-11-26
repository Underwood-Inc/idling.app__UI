---
title: Navbar
description: Compound nav layout primitives
---

# Navbar

Compound component: `Object.assign` on a `<nav className="navbar__container">` root with static subcomponents:

| Subcomponent | Role |
|--------------|------|
| `Navbar.Brand` | Session-aware avatar slot |
| `Navbar.Body` | Horizontal body row |
| `Navbar.Content` | Flex region with `justify` → `navbar__content--jc-*` |
| `Navbar.Item` | Single slot with optional `data-testid` |

Primary consumer: `Nav.tsx`.

---

**Sources:** `src/app/components/navbar/Navbar.tsx`