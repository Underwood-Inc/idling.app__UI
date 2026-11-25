'use client';

import type {
  MessageTickerQuoteOverlayLabels,
  MessageTickerQuoteOverlayViewModel,
} from '@molecules/quotes/messageTickerQuoteOverlay';

import './MessageTickerQuoteModalContent.css';

export interface MessageTickerQuoteModalContentProps {
  viewModel: MessageTickerQuoteOverlayViewModel;
  labels: MessageTickerQuoteOverlayLabels;
  onClose?: () => void;
}

export function MessageTickerQuoteModalContent({
  viewModel,
  labels,
  onClose,
}: MessageTickerQuoteModalContentProps) {
  return (
    <article className="message-ticker-quote-modal" aria-labelledby="message-ticker-quote-title">
      <header className="message-ticker-quote-modal__header">
        <h2 id="message-ticker-quote-title" className="message-ticker-quote-modal__title">
          {labels.modalTitle}
        </h2>
        <button
          type="button"
          className="message-ticker-quote-modal__close"
          onClick={onClose}
          aria-label={labels.closeModalAria}
        >
          ×
        </button>
      </header>
      <blockquote className="message-ticker-quote-modal__body">
        <p className="message-ticker-quote-modal__text">{viewModel.text}</p>
      </blockquote>
      <footer className="message-ticker-quote-modal__footer">
        <p className="message-ticker-quote-modal__attribution">{viewModel.attribution}</p>
      </footer>
    </article>
  );
}