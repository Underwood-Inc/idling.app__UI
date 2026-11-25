import { test, expect } from 'vitest';

import type { IdlingQuoteRecord } from './idlingQuoteTypes';
import {
  MESSAGE_TICKER_QUOTE_OVERLAY_ID,
  buildMessageTickerQuoteOverlayViewModel,
} from './messageTickerQuoteOverlay';

const sampleRecord: IdlingQuoteRecord = {
  id: 'quote-sample-1',
  locale: 'en',
  text: 'Ardently do today what must be done. Who knows? Tomorrow, death comes.',
  author: 'Buddha',
  sourceTitle: 'Dhammapada',
  attribution: 'Buddha — Dhammapada',
  textHash: 'abc',
  provenanceProvider: 'fixture',
};

/**
 * @description Quote overlay exposes the full body and attribution for reading outside the marquee.
 * @owner idling-app
 * @priority high
 */
test('[MT-001] when building the overlay view model, quote text and attribution are preserved in full', () => {
  const viewModel = buildMessageTickerQuoteOverlayViewModel(sampleRecord);

  expect(viewModel.quoteId).toBe('quote-sample-1');
  expect(viewModel.text).toBe(sampleRecord.text);
  expect(viewModel.attribution).toBe(sampleRecord.attribution);
  expect(viewModel.author).toBe('Buddha');
  expect(viewModel.sourceTitle).toBe('Dhammapada');
});

/**
 * @description Overlay id is stable so open/close helpers target the same modal instance.
 */
test('[MT-002] message ticker quote overlay uses a fixed overlay id constant', () => {
  expect(MESSAGE_TICKER_QUOTE_OVERLAY_ID).toBe('message-ticker-quote-modal');
});