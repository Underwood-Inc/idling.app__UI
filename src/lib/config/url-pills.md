---
title: url-pills
description: Domain registry and behaviors for submission URL pills
---

# url-pills

Defines supported hosts, regex matchers, and per-domain behaviors (embed, link, modal, etc.).

## Types

- **`URLPillDomain`** — `domain`, `behaviors`, `defaultBehavior`, `regex`, optional `extractId`
- **`URLPillBehavior`** — id, name, `requiresModal`, enabled flag

## Functions

`detectURLsInText`, `parseURLPill`, behavior resolution — consumed by `content-parsers` and rich renderers.

YouTube embed/link behaviors are declared in this file; image hosts delegate checks to `media-domains`.

---

**Sources:** `src/lib/config/url-pills.ts`, `src/lib/config/media-domains.ts`