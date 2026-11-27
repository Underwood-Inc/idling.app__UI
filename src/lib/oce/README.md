# Offline Connectivity Engine (idling.app)

Vendored copy of `strixun-stream-suite/packages/api-framework/src/connectivity` so production deploy and CI install without a sibling `strixun-stream-suite` checkout or `file:` dependency.

| Import | Use |
|--------|-----|
| `@lib/oce/connectivity` | `getPageConnectivityEngine`, `createConnectivityEngine`, types |
| `@lib/oce/idlingFetch` | Page bootstrap: `idlingFetch` + `getIdlingOceEngine()` (`/api/version` probe) |
| `@lib/oce/oceConnectivityToasts` | `bindOceConnectivityToasts(engine)` → vendored toast hints |
| `@lib/oce/connectivity` | `useConnectivitySnapshot`, `useOceUnavailable` (React) |

UI wiring: `ToastViewport` + `OceConnectivityToastBridge` in `SiteChromeProviders`.

**SW cache + OCE:** Cache-served responses get `x-idling-sw-cache-served: 1`. `idlingOceFetchAdoption.ts` wraps `idlingFetch` so those flights settle as **ignored** (not online, not failure); UI still receives the cached body.

Keep parity with upstream when OCE changes; run `src/lib/oce/connectivity/connectivity.engine.test.ts` (FR-OCE-001–010).

Docusaurus guide: `/guides/offline-connectivity-engine/`.