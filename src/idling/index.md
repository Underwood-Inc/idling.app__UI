---
title: 'Idling.app application'
description: 'Features and APIs shipped in this Next.js repository'
sidebar_position: 0
---

# Idling.app application

**In plain terms:** the social site, radio player, admin tools, and marketing pages in **this** repo (`idling.app__UI`) — distinct from Stream Suite workers in `strixun-stream-suite`.

## App Router entry (audited)

| Surface | Path |
| ------- | ---- |
| Root layout + PWA manifest link | `src/app/layout.tsx` |
| Site chrome providers (locale, SW, radio) | `src/app/components/site-chrome/SiteChromeProviders.tsx` |
| Public infra bypass list | `src/lib/routes.ts` (`/sw.js`, manifests) |
| Auth proxy exclusions | `src/proxy.ts` |

## Feature deep dives

| Feature | Route / API | Hub page |
| ------- | ----------- | -------- |
| Radio player | `/` dock + `GET /api/radio/*` | [Radio](/idling/radio) |
| Radio PWA | `idling-radio.webmanifest`, `public/sw.js` | [PWA](/idling/pwa) |
| Message ticker | Client bundle `src/data/quotes/` | [Quotes](/idling/quotes) |
| Mystical Card Generator | `/card-generator`, `GET /api/og-image` | [Card generator](/idling/card-generator) |
| SVG to PNG tool | `/svg-converter`, `POST /api/svg-to-png` | [SVG converter](/idling/svg-converter) |
| HTTP API catalog | OpenAPI + 63 route handlers | [API overview](/idling/api-overview) |

Co-located API neighbors live under `src/app/api/**` (sidebar **Code-adjacent**). Regenerate OpenAPI after route changes: `pnpm docs:openapi`.

## i18n (site chrome)

UI strings: typesafe-i18n under `src/i18n/`. Runtime provider: `IdlingLocaleProvider`. Policy hub: [/guides/i18n](/guides/i18n). Server metadata stays English: [/guides/i18n-ssr-metadata](/guides/i18n-ssr-metadata).

## What lives elsewhere

Stream Suite products (auth, mods, shortener, streamkit backend) are documented under [Products](/products/stream-suite) — only marketing routes and embeds live here.

```mermaid
flowchart TB
  UI[Next.js App Router]
  UI --> Radio[Radio + /api/radio]
  UI --> Admin[/api/admin/*]
  UI --> Tools[Card / SVG tools]
  UI --> Showcase[Product marketing pages]
  UI --> SW[sw.js + radio PWA manifest]
```

## Operator onboarding

Contributors: [/guides/getting-started](/guides/getting-started). Doc honesty rules: [/guides/source-audit](/guides/source-audit).

---

**Sources:** `src/app/layout.tsx`, `src/lib/routes.ts`, `src/app/api/**/route.ts`, `docusaurus.config.js`, hub pages under `src/idling/`