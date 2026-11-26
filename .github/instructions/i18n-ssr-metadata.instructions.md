---
applyTo: "src/app/layout.tsx,src/app/page.tsx,src/i18n/idling-server-i18n.ts,src/molecules/i18n/idlingMeta.ts,src/app/components/locale/IdlingLocaleProvider.tsx"
---

# SSR metadata and i18n

Canonical gotcha: `src/i18n/i18n-ssr-metadata-gotcha.mdx`.

- Shell routes: `export const metadata` from `META_EN` / `buildRootSiteMetadata()` — not async `generateMetadata` + locale chunks.
- `getServerLL()`: sync English only (`initIdlingI18n('en')`); never `initIdlingI18nAsync` / `loadLocaleAsync` on the server seam.
- Client localization: `IdlingLocaleProvider` only; must not block first paint (see `docs/i18n.md` § Runtime).

Prod symptom if broken: `/api/test/health` fast, `/` zero bytes until timeout.