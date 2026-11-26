---
title: QuoteService
description: Weighted round-robin external quote fetching
---

# QuoteService

## Construction

Builds shuffled weighted index pool from `QUOTE_APIS` in `../config` (weights expand pool entries).

## `fetchRandomQuote(): Promise<QuoteData>`

Up to `QUOTE_APIS.length` attempts: `fetch` with 5s abort, custom UA `Idling.app OG Image Generator`, per-API `transform`. On exhaustion uses `FALLBACK_QUOTES`.

No auth; failures advance pool index and reshuffle when cycle completes.

---

**Sources:** `src/app/api/og-image/services/QuoteService.ts`