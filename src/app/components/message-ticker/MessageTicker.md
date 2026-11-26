---
title: MessageTicker
description: Horizontal scrolling quote strip with CSS-driven duration
category: component
---

# MessageTicker

**Role:** presentational **ticker strip**. Accepts `messages: string[]` and optional `onQuoteOpen` click handler. Does **not** fetch quotes — parent supplies lines.

## Props

| Prop | Type | Default | Behavior |
| ---- | ---- | ------- | -------- |
| `messages` | `string[]` | `[]` | Text nodes rendered in two duplicated sequences for seamless CSS scroll |
| `onQuoteOpen` | `() => void` | undefined | Entire container is clickable when provided |

## Animation

On `messages` change, measures `scrollWidth` vs parent width and sets `animationDuration` to `(tickerWidth / containerWidth) * 20` seconds (inline style on `.message-ticker__content`).

When exactly **one** message exists, duplicates it six times so the strip fills horizontal space before doubling for the infinite loop.

Uses `FadeIn` with `DisplayType.SPAN` per message chunk.

## Production wiring

Site chrome uses **`MessageTickerWithInterval`**, which:

- Loads quote bundles via `ensureQuoteBundleReady` / `ensureQuoteLocaleShard`
- Picks quotes with `pickMessageTickerQuote(localeId, separator)` from localized shards
- Formats lines through `formatTickerLine` + `useIdlingLocale().ll`
- Opens overlay via `openMessageTickerQuoteOverlay` + `OverlayContext`

See [Quotes & message ticker](/idling/quotes).

---

**Sources:** `MessageTicker.tsx`, `MessageTickerWithInterval.tsx`