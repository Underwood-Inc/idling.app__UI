---
title: tickerActions
description: Server action for random ticker quote payload
---

# tickerActions

`'use server'` module for client refresh paths that cannot read quote bundles directly.

## `fetchTickerQuote(localeInput, separator)`

Coerces locale via `coerceIdlingLocaleId`, loads `getRandomQuoteFromBundleServer`, falls back to English, returns `idlingQuoteRecordToTickerPayload` or `null`.

Re-exports `TickerQuotePayload` alias of `MessageTickerQuotePayload`.

---

**Sources:** `src/app/components/message-ticker/tickerActions.ts`, `@molecules/quotes/idlingQuoteBundleRuntime.server`