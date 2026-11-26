---
title: MessageTickerWithInterval
description: Locale-aware scrolling quote ticker with overlay detail
---

# MessageTickerWithInterval

Default export wired into site chrome. Rotates quotes from the idling quote bundle (`pickMessageTickerQuote`, `ensureQuoteBundleReady`, locale shards).

## Behavior

- Formats lines via `formatTickerLine` and empty-state copy from `ll.messageTicker`.
- Interval refresh of quote payload; preloads bundles on locale change.
- Click opens `openMessageTickerQuoteOverlay` through `useOverlay` with view model from `buildMessageTickerQuoteOverlayViewModel`.

Renders `MessageTicker` with computed `messages` and `onQuoteOpen` handler.

---

**Sources:** `src/app/components/message-ticker/MessageTickerWithInterval.tsx`, `@molecules/quotes/messageTickerQuotePayload`