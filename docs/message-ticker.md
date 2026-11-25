# Message ticker

The header ticker no longer calls external quote APIs at runtime. It reads from the **indexed quote corpus** (see [`docs/quotes/internal-quote-store.md`](./quotes/internal-quote-store.md)).

## Maintainer workflow

```bash
pnpm quotes:harvest
pnpm quotes:export
pnpm quotes:translate        # LibreTranslate quote bodies into locale shards
pnpm l10n:refresh          # quotes + site chrome locales
pnpm quotes:import-db      # optional — Postgres after migration 0061
```

**Rotation:** random quote on load and every **10–20 minutes** (unchanged). Changing the language picker loads a quote for that locale immediately; the rotation timer resets from that moment.

**Full quote:** click the scrolling ticker to open the shared site overlay modal (`OverlayRenderer` modal type — same shell as Galaxy) with the full quote text and a single attribution line in the footer.

## UI

- Component: [`MessageTickerWithInterval`](../src/app/components/message-ticker/MessageTickerWithInterval.tsx)
- Server action: [`tickerActions.ts`](../src/app/components/message-ticker/tickerActions.ts)
- Display format: quote text, locale separator, attribution string