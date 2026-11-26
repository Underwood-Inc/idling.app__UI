---
title: openMessageTickerQuoteOverlay
description: Registers ticker quote modal in the overlay stack
---

# openMessageTickerQuoteOverlay

Helper accepting `openOverlay`, `closeOverlay`, `viewModel`, and `labels`. Opens overlay id `MESSAGE_TICKER_QUOTE_OVERLAY_ID` as type `modal` with `MessageTickerQuoteModalContent` and shell class `message-ticker-quote-modal__shell`. Wires `onClose` to `closeOverlay(modalId)`.

---

**Sources:** `src/app/components/message-ticker/openMessageTickerQuoteOverlay.tsx`, `@lib/context/OverlayContext`