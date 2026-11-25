'use client';

import { useOverlay } from '@lib/context/OverlayContext';
import { formatTickerLine } from '@molecules/quotes/idlingMessageTickerFormat';
import { buildMessageTickerQuoteOverlayViewModel } from '@molecules/quotes/messageTickerQuoteOverlay';
import type { MessageTickerQuotePayload } from '@molecules/quotes/messageTickerQuotePayload';
import {
  ensureQuoteBundleReady,
  ensureQuoteLocaleShard,
} from '@molecules/quotes/idlingQuoteBundleRuntime';
import { pickMessageTickerQuote } from '@molecules/quotes/messageTickerQuotePayload';
import type { IdlingQuoteRecord } from '@molecules/quotes/idlingQuoteTypes';
import type { TranslationFunctions } from '$i18n/i18n-types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { MessageTicker } from './MessageTicker';
import { openMessageTickerQuoteOverlay } from './openMessageTickerQuoteOverlay';

function payloadToRecord(
  payload: MessageTickerQuotePayload,
  locale: string
): IdlingQuoteRecord {
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

function tickerLines(
  payload: MessageTickerQuotePayload | null,
  ll: TranslationFunctions
): { quote: MessageTickerQuotePayload | null; lines: string[] } {
  if (!payload?.text) {
    return { quote: null, lines: [ll.messageTicker.empty()] };
  }
  const record = payloadToRecord(payload, payload.locale);
  return { quote: payload, lines: [formatTickerLine(record, ll)] };
}

export default function MessageTickerWithInterval() {
  const { localeId, ll } = useIdlingLocale();
  const { openOverlay, closeOverlay } = useOverlay();
  const separator = ll.messageTicker.separator();

  const refreshQuote = useCallback(() => {
    const payload = pickMessageTickerQuote(localeId, separator);
    return tickerLines(payload, ll);
  }, [localeId, ll, separator]);

  const [activeQuote, setActiveQuote] = useState<MessageTickerQuotePayload | null>(() => {
    const payload = pickMessageTickerQuote(localeId, separator);
    return payload?.text ? payload : null;
  });
  const [message, setMessage] = useState<string[]>(() => tickerLines(
    pickMessageTickerQuote(localeId, separator),
    ll
  ).lines);

  const refreshRef = useRef(refreshQuote);
  refreshRef.current = refreshQuote;

  useEffect(() => {
    let cancelled = false;
    void ensureQuoteBundleReady()
      .then(() => ensureQuoteLocaleShard(localeId))
      .then(() => {
      if (cancelled) {
        return;
      }
      const next = refreshRef.current();
      setActiveQuote(next.quote);
      setMessage(next.lines);
    });
    return () => {
      cancelled = true;
    };
  }, [localeId, ll, separator]);

  useEffect(() => {
    const getRandomInterval = () => {
      const minInterval = 10 * 60 * 1000;
      const maxInterval = 20 * 60 * 1000;
      return (
        Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval
      );
    };

    const intervalRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

    const setupInterval = () => {
      const randomInterval = getRandomInterval();
      return setTimeout(() => {
        const next = refreshRef.current();
        setActiveQuote(next.quote);
        setMessage(next.lines);
        intervalRef.current = setupInterval();
      }, randomInterval);
    };

    intervalRef.current = setupInterval();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

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