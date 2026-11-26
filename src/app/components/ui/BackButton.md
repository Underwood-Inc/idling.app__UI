---
title: BackButton
description: Localized back link with optional scroll restoration into paginated lists
---

# BackButton

Client `Link` that labels itself from `COMMON_EN` via `useIdlingLocale` and can rebuild the destination URL from stored scroll state.

## Props (`BackButtonProps`)

| Prop | Default | Role |
|------|---------|------|
| `fallbackHref` | `'/'` | Target when history/scroll data is absent |
| `scrollRestoreKey` | — | Key for `getStoredScrollPosition`; merges `page` query when returning |
| `onBack` | — | If set, `preventDefault` and invoke instead of navigation |
| `children` | i18n label | Visible link text |
| `className` | `''` | Appended to `back-button` |

## Behavior

On mount, sets `canGoBack` from `history.length` and, when `scrollRestoreKey` is set, builds `targetHref` from stored pathname, search, and page. Click with scroll data writes `restore-scroll-key` / `restore-scroll-position` to `sessionStorage` and `router.push(targetHref)` instead of default `Link` navigation.

## Usage

Place on detail views that should return users to the same list page and filter state they left.

---

**Sources:** `src/app/components/ui/BackButton.tsx`, `@lib/utils/scroll-position`, `$i18n-source/common.en`