'use client';

import { useOverlay } from '@lib/context/OverlayContext';
import { formatTickerLine } from '@molecules/quotes/idlingMessageTickerFormat';
import { buildMessageTickerQuoteOverlayViewModel } from '@molecules/quotes/messageTickerQuoteOverlay';
import type { IdlingQuoteRecord } from '@molecules/quotes/idlingQuoteTypes';
import { useCallback, useEffect, useState } from 'react';

import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { MessageTicker } from './MessageTicker';
import { openMessageTickerQuoteOverlay } from './openMessageTickerQuoteOverlay';
import { fetchTickerQuote, type TickerQuotePayload } from './tickerActions';

function payloadToRecord(payload: TickerQuotePayload, locale: string): IdlingQuoteRecord {
  return {
    id: payload.id,
    locale,
    text: payload.text,
    author: payload.author,
    sourceTitle: payload.sourceTitle,
    attribution: payload.attribution,
    textHash: '',
    provenanceProvider: 'message-ticker-bundle',
  };
}

export default function MessageTickerWithInterval() {
  const { localeId, ll } = useIdlingLocale();
  const { openOverlay, closeOverlay } = useOverlay();
  const [message, setMessage] = useState<string[]>([]);
  const [activeQuote, setActiveQuote] = useState<TickerQuotePayload | null>(null);
  const [pending, setPending] = useState(true);

  const loadQuote = useCallback(() => {
    setPending(true);
    fetchTickerQuote(localeId, ll.messageTicker.separator())
      .then((result) => {
        if (result?.text) {
          setActiveQuote(result);
          const record = payloadToRecord(result, result.locale);
          setMessage([formatTickerLine(record, ll)]);
        } else {
          setActiveQuote(null);
          setMessage([ll.messageTicker.empty()]);
        }
      })
      .catch(() => {
        setActiveQuote(null);
        setMessage([ll.messageTicker.empty()]);
      })
      .finally(() => {
        setPending(false);
      });
  }, [localeId, ll]);

  useEffect(() => {
    loadQuote();

    const getRandomInterval = () => {
      const minInterval = 10 * 60 * 1000;
      const maxInterval = 20 * 60 * 1000;
      return (
        Math.floor(Math.random() * (maxInterval - minInterval + 1)) +
        minInterval
      );
    };

    const intervalRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

    const setupInterval = () => {
      const randomInterval = getRandomInterval();
      return setTimeout(() => {
        loadQuote();
        intervalRef.current = setupInterval();
      }, randomInterval);
    };

    intervalRef.current = setupInterval();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [loadQuote]);

  const handleOpenQuote = useCallback(() => {
    if (!activeQuote) {
      return;
    }

    const viewModel = buildMessageTickerQuoteOverlayViewModel(
      payloadToRecord(activeQuote, localeId)
    );

    openMessageTickerQuoteOverlay({
      openOverlay,
      closeOverlay,
      viewModel,
      labels: {
        modalTitle: ll.messageTicker.modalTitle(),
        closeModalAria: ll.messageTicker.closeModalAria(),
      },
    });
  }, [activeQuote, closeOverlay, localeId, ll, openOverlay]);

  if (pending && message.length === 0) {
    return <span>{ll.messageTicker.loading()}</span>;
  }

  if (message.length === 0) {
    return <span>{ll.messageTicker.empty()}</span>;
  }

  return (
    <MessageTicker
      messages={message}
      onQuoteOpen={activeQuote ? handleOpenQuote : undefined}
    />
  );
}