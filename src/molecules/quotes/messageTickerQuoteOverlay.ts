import type { IdlingQuoteRecord } from './idlingQuoteTypes';

export const MESSAGE_TICKER_QUOTE_OVERLAY_ID = 'message-ticker-quote-modal';

export interface MessageTickerQuoteOverlayViewModel {
  quoteId: string;
  text: string;
  attribution: string;
  author: string;
  sourceTitle: string;
}

export interface MessageTickerQuoteOverlayLabels {
  modalTitle: string;
  closeModalAria: string;
}

export function buildMessageTickerQuoteOverlayViewModel(
  record: IdlingQuoteRecord
): MessageTickerQuoteOverlayViewModel {
  return {
    quoteId: record.id,
    text: record.text,
    attribution: record.attribution,
    author: record.author,
    sourceTitle: record.sourceTitle,
  };
}