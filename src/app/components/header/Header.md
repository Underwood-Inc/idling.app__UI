---
title: Header
description: Top site header with main navigation
---

# Header

Async server component for the **global top chrome** on standard marketing and app pages. No props; no client boundaries in this file.

## Exports

- Default export `Header`

## Render

```
<header className="header">
  <div className="header__nav">
    <Nav />
  </div>
</header>
```

`Nav` is itself async: calls `auth()`, renders `Navbar` with mobile drawer, path links, brand, search (when signed in), and `NavAuth`.

## Styling

`Header.scss` defines header height, background, and nav inset. Radio dock and ticker sit **below** this region via site chrome, not inside `Header`.

## Edge cases

Admin and minimal layouts may omit or replace this component; when present, every page gets a fresh session read through `Nav` on each request (`unstable_noStore()`).

---

**Sources:** `src/app/components/header/Header.tsx`, `src/app/components/header/Header.scss`, `src/app/components/nav/Nav.tsx`