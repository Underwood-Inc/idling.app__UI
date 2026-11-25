'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Locales, TranslationFunctions } from '$i18n/i18n-types';
import { loadLocaleAsync } from '$i18n/i18n-util.async';
import {
  getLL,
  getLocale,
  initIdlingI18n,
  initIdlingI18nAsync,
  setIdlingLocale,
  subscribeIdlingLocale,
} from '$i18n/idling-i18n';
import {
  IDLING_BASE_LOCALE,
  IDLING_LOCALE_CATALOG,
  type IdlingLocaleId,
} from '@molecules/quotes/idlingLocaleCatalog';
import {
  IDLING_UI_LOCALE_STORAGE_KEY,
  resolveIdlingLocale,
} from '@molecules/quotes/resolveIdlingLocale';
import { writeIdlingLocaleCookie } from '@molecules/quotes/writeIdlingLocaleCookie';

interface IdlingLocaleContextValue {
  localeId: IdlingLocaleId;
  /** Bumps after each successful `setIdlingLocale` / global locale notify. */
  localeRevision: number;
  ll: TranslationFunctions;
  loading: boolean;
  setLocaleId: (id: IdlingLocaleId) => void;
  catalog: typeof IDLING_LOCALE_CATALOG;
}

const IdlingLocaleContext = createContext<IdlingLocaleContextValue | null>(null);

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test';
}

function resolveInitialLocale(): IdlingLocaleId {
  if (typeof window === 'undefined') {
    return IDLING_BASE_LOCALE;
  }
  return resolveIdlingLocale();
}

function bootLocaleSync(locale: IdlingLocaleId): void {
  initIdlingI18n(locale as Locales);
  try {
    writeIdlingLocaleCookie(locale);
  } catch {
    /* ignore */
  }
}

function testLocaleContext(): IdlingLocaleContextValue {
  bootLocaleSync(IDLING_BASE_LOCALE);
  return {
    localeId: getLocale() as IdlingLocaleId,
    localeRevision: 0,
    ll: getLL(),
    loading: false,
    setLocaleId: () => {},
    catalog: IDLING_LOCALE_CATALOG,
  };
}

/** Same stack as Mappy site + Overlane console: typesafe-i18n global `getLL()`, async chunks on switch. */
export function IdlingLocaleProvider({ children }: { children: ReactNode }) {
  const [initialLocale] = useState<IdlingLocaleId>(resolveInitialLocale);
  /** Sync bundled locales on first paint — never gate the whole app on async chunk loads. */
  const [ready] = useState(() => {
    bootLocaleSync(initialLocale);
    return true;
  });
  const [localeEpoch, bumpLocale] = useState(0);
  const loading = false;

  useEffect(() => {
    if (isTestRuntime()) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await loadLocaleAsync('en');
        await initIdlingI18nAsync(initialLocale as Locales);
        writeIdlingLocaleCookie(initialLocale);
        if (!cancelled) {
          bumpLocale((n) => n + 1);
        }
      } catch {
        /* sync boot already active */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialLocale]);

  useEffect(() => subscribeIdlingLocale(() => bumpLocale((n) => n + 1)), []);

  const setLocaleId = useCallback((id: IdlingLocaleId) => {
    try {
      localStorage.setItem(IDLING_UI_LOCALE_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    writeIdlingLocaleCookie(id);
    initIdlingI18n(id as Locales);
    bumpLocale((epoch) => epoch + 1);
    void setIdlingLocale(id as Locales);
  }, []);

  const value = useMemo(
    () => ({
      localeId: getLocale() as IdlingLocaleId,
      localeRevision: localeEpoch,
      ll: getLL(),
      loading,
      setLocaleId,
      catalog: IDLING_LOCALE_CATALOG,
    }),
    [ready, localeEpoch, loading, setLocaleId]
  );

  if (!ready) {
    return null;
  }

  return (
    <IdlingLocaleContext.Provider value={value}>{children}</IdlingLocaleContext.Provider>
  );
}

export function useIdlingLocale(): IdlingLocaleContextValue {
  const ctx = useContext(IdlingLocaleContext);
  if (!ctx) {
    if (isTestRuntime()) {
      return testLocaleContext();
    }
    throw new Error('useIdlingLocale must be used within IdlingLocaleProvider');
  }
  return ctx;
}