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
  initIdlingI18n,
  initIdlingI18nAsync,
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
  /** Bumps after async locale apply (radio / copy hooks). */
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

function testLocaleContext(): IdlingLocaleContextValue {
  initIdlingI18n(IDLING_BASE_LOCALE);
  return {
    localeId: IDLING_BASE_LOCALE,
    localeRevision: 0,
    ll: getLL(),
    loading: false,
    setLocaleId: () => {},
    catalog: IDLING_LOCALE_CATALOG,
  };
}

/**
 * Mappy site pattern: {@link https://github.com/Underwood-Inc/mappy-internal/blob/main/site/src/context/SiteLocaleContext.tsx SiteLocaleContext}
 * — async `loadLocaleAsync('en')` then `initIdlingI18nAsync`, never sync-boot a non-English locale.
 */
export function IdlingLocaleProvider({ children }: { children: ReactNode }) {
  /** Same on server and first client paint — avoids hydration mismatch (stored locale applied in effect). */
  const [localeId, setLocaleIdState] = useState<IdlingLocaleId>(IDLING_BASE_LOCALE);
  const [localeEpoch, bumpLocale] = useState(0);

  useEffect(() => {
    initIdlingI18n(IDLING_BASE_LOCALE);
    const stored = resolveIdlingLocale();
    if (stored !== IDLING_BASE_LOCALE) {
      setLocaleIdState(stored);
    }
  }, []);

  const applyLocale = useCallback(async (id: IdlingLocaleId) => {
    await loadLocaleAsync('en');
    await initIdlingI18nAsync(id as Locales);
    try {
      writeIdlingLocaleCookie(id);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void applyLocale(localeId)
      .then(() => {
        if (!cancelled) {
          bumpLocale((n) => n + 1);
        }
      })
      .catch(() => {
        /* English module init remains usable */
      });
    return () => {
      cancelled = true;
    };
  }, [localeId, applyLocale]);

  useEffect(() => subscribeIdlingLocale(() => bumpLocale((n) => n + 1)), []);

  const setLocaleId = useCallback((id: IdlingLocaleId) => {
    if (id === localeId) {
      return;
    }
    try {
      localStorage.setItem(IDLING_UI_LOCALE_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setLocaleIdState(id);
  }, [localeId]);

  const value = useMemo(
    () => ({
      localeId,
      localeRevision: localeEpoch,
      ll: getLL(),
      loading: false,
      setLocaleId,
      catalog: IDLING_LOCALE_CATALOG,
    }),
    [localeId, localeEpoch, setLocaleId]
  );

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