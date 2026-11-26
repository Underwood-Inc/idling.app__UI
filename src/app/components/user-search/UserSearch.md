---
title: UserSearch
description: Autocomplete user lookup for authenticated nav
---

# UserSearch

Client combobox-style search. Props: optional `placeholder`, `className`, `onUserSelect`.

## Flow

- Requires authenticated session (`useSession`); debounced fetch when query length ≥ 2.
- Keyboard navigation (arrow keys, enter) and click-outside to close.
- Results render `Username` rows; default selection navigates to `/profile/{id}` via `useRouter`.
- Loading and auth error states surfaced inline.

Styles: `UserSearch.css`.

---

**Sources:** `src/app/components/user-search/UserSearch.tsx`, `src/app/components/username/Username.tsx`