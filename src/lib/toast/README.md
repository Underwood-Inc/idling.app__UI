# Toast notifications (idling.app)

Self-contained in-app toast stack (no npm runtime dependency). Vendored pattern matches `@lib/oce`: import from `@lib/toast` only.

| Import | Use |
|--------|-----|
| `@lib/toast` | `toast()`, `toast.success()`, `toast.dismissByKey()` |
| `@lib/toast/placement` | `DEFAULT_TOAST_PLACEMENT`, `TOAST_PLACEMENT_BY_VARIANT` |
| `ToastViewport` | Mount once in `SiteChromeProviders` |

**Dismiss modes:** `auto` (timer + hover pause) or `manual` (close required).

**Stacking:** max 5 per viewport; `dedupeKey` updates in place.

**OCE:** network toasts bind inside `<OceProvider>` (`@lib/oce`).