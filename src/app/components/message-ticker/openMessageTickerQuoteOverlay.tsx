'use client';

import type { OverlayConfig } from '@lib/context/OverlayContext';
import {
  MESSAGE_TICKER_QUOTE_OVERLAY_ID,
  type MessageTickerQuoteOverlayLabels,
  type MessageTickerQuoteOverlayViewModel,
} from '@molecules/quotes/messageTickerQuoteOverlay';

import { MessageTickerQuoteModalContent } from './MessageTickerQuoteModalContent';

export interface OpenMessageTickerQuoteOverlayArgs {
  openOverlay: (config: OverlayConfig) => void;
  closeOverlay: (id: string) => void;
  viewModel: MessageTickerQuoteOverlayViewModel;
  labels: MessageTickerQuoteOverlayLabels;
}

export function openMessageTickerQuoteOverlay({
  openOverlay,
  closeOverlay,
  viewModel,
  labels,
}: OpenMessageTickerQuoteOverlayArgs): void {
  const modalId = MESSAGE_TICKER_QUOTE_OVERLAY_ID;

  openOverlay({
    id: modalId,
    type: 'modal',
    component: MessageTickerQuoteModalContent,
    props: {
      className: 'message-ticker-quote-modal__shell',
      viewModel,
      labels,
      onClose: () => closeOverlay(modalId),
    },
  });
}