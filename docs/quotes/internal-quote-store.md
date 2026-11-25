# Internal quote store

Indexed Buddhist quotes with required attribution, shared by the message ticker and future idling surfaces.

## Data model

Types: [`src/molecules/quotes/idlingQuoteTypes.ts`](../src/molecules/quotes/idlingQuoteTypes.ts)  
Retention gate: [`validateQuoteForRetention`](../src/molecules/quotes/validateQuoteForRetention.ts) — rows missing author or source citation are **not** stored.

## Storage

| Layer | Location |
|-------|----------|
| Postgres | `idling_quotes`, `idling_quote_locales` (migration `0061-create-idling-quotes.sql`) |
| Export index | `src/data/quotes/quote-index.json` |
| Locale shards | `src/data/quotes/locales/{locale}.json` |
| Harvest source | `src/data/quotes/corpus.en.json` (generated) |

## Internal HTTP API (future)

Not shipped yet. Production consumption is **in-process** only:

- Server action [`fetchTickerQuote`](../../src/app/components/message-ticker/tickerActions.ts)
- [`idlingMessageTickerCatalog`](../../src/molecules/quotes/idlingMessageTickerCatalog.ts) reading `src/data/quotes/locales/{locale}.json`

When we add HTTP later: reuse [`assertInternalQuoteAccess`](../../src/molecules/quotes/assertInternalQuoteAccess.ts) and `IdlingQuoteRepository` — same allowlist + `IDLING_INTERNAL_QUOTE_SECRET` documented in `.env.local.example`.

## Harvest providers

Multi-provider one-time harvest: `pnpm quotes:harvest` (see [`scripts/message-ticker/harvest-buddhist-quotes.mjs`](../scripts/message-ticker/harvest-buddhist-quotes.mjs)).