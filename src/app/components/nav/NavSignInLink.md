---
title: NavSignInLink
description: Localized sign-in link for nav surfaces
---

# NavSignInLink

Client sign-in entry used in desktop `NavAuth` and mobile drawer footers. Wraps **`InstantLink`** so middle-click and href semantics stay correct while supporting drawer close hooks.

## Exports

- `NavSignInLink` — optional `onClick?: () => void`

## Behavior

- `href` → `NAV_PATHS.SIGNIN` (via `InstantLink`).
- Visible label: `ll.auth.signInNav()` from `useIdlingLocale()`.
- When `onClick` is passed (mobile drawer), fires before navigation so the drawer can dismiss.
- `data-testid` from `NAV_SELECTORS.SIGN_IN_LINK`.

No auth state branching — unsigned users see this link; signed-in chrome uses other `NavAuth` children.

---

**Sources:** `src/app/components/nav/NavSignInLink.tsx`, `src/app/components/ui/InstantLink.tsx`, `src/lib/routes`, `src/lib/test-selectors/components/nav.selectors`