---
title: Search Query Parser
description: Shared AND/OR phrase and wildcard parser for Mods Hub and suite search UIs
---

# Search Query Parser

**What this is:** Workspace package **`@strixun/search-query-parser`** — parses human-friendly filter strings into structured match plans (exact phrases, space-AND terms, pipe-OR groups, `term*` prefix wildcards). Ships React (`AdvancedSearchInput.tsx`) and Svelte (`AdvancedSearchInput.svelte`) entry points.

## API entry

- **Main:** `strixun-stream-suite/packages/search-query-parser/index.ts`
- **Exports:** `.`, `./react`, `./svelte` per `package.json`
- **Core type:** `SearchQueryResult` — `exactPhrases`, `orGroups`, `hasContent`
- **Primary function:** `parseSearchQuery(query: string)` (documented with examples in source header)

## Consumers (repo)

- `@strixun/mods-hub` depends on workspace `search-query-parser` for advanced catalog search.

## Failure modes

| Issue | Check |
| ----- | ----- |
| OR group too greedy | Parser splits on `|` before AND tokenization — test with quoted phrases |
| Wildcard over-match | Prefix wildcard is suffix `*` only (no infix `*` semantics) |

---

**Sources (audited):** `strixun-stream-suite/packages/search-query-parser/package.json`, `strixun-stream-suite/packages/search-query-parser/index.ts`