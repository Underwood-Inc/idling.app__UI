'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { Locales, TranslationFunctions } from '$i18n/i18n-types';
import { loadLocaleAsync } from '$i18n/i18n-util.async';
import {
  commitIdlingLocale,
  getLL,
  initIdlingI18n,
} from '$i18n/idling-i18n';
import {
  IDLING_BASE_LOCALE,
  IDLING_LOCALE_CATALOG,
  type IdlingLocaleId,
} from '@molecules/quotes/idlingLocaleCatalog';
import {
  IDLING_UI_LOCALE_STORAGE_KEY,
  resolveIdlingLocaleFromStorage,
} from '@molecules/quotes/resolveIdlingLocale';
import { writeIdlingLocaleCookie } from '@molecules/quotes/writeIdlingLocaleCookie';

interface IdlingLocaleContextValue {
  localeId: IdlingLocaleId;
  ll: TranslationFunctions;
  loading: boolean;
  setLocaleId: (id: IdlingLocaleId) => void;
  catalog: typeof IDLING_LOCALE_CATALOG;
}

const IdlingLocaleContext = createContext<IdlingLocaleContextValue | null>(null);

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test';
}

function bootEnglish(): TranslationFunctions {
  initIdlingI18n(IDLING_BASE_LOCALE);
  return getLL();
}

function testLocaleContext(): IdlingLocaleContextValue {
  return {
    localeId: IDLING_BASE_LOCALE,
    ll: bootEnglish(),
    loading: false,
    setLocaleId: () => {},
    catalog: IDLING_LOCALE_CATALOG,
  };
}

/**
 * Sync English for first paint. Other UI locales load only on picker change or
 * deferred localStorage preference (not navigator language on every visit).
 */
export function IdlingLocaleProvider({ children }: { children: ReactNode }) {
  const [localeId, setLocaleIdState] = useState<IdlingLocaleId>(IDLING_BASE_LOCALE);
  const [llRevision, setLlRevision] = useState(() => {
    initIdlingI18n(IDLING_BASE_LOCALE);
    return 0;
  });
  const [loading, setLoading] = useState(false);
  const loadSeq = useRef(0);

  const bumpLl = useCallback(() => {
    setLlRevision((revision) => revision + 1);
  }, []);

  const applyLocaleAsync = useCallback(async (target: IdlingLocaleId, seq: number) => {
    if (target === IDLING_BASE_LOCALE) {
      if (loadSeq.current !== seq) {
        return;
      }
      initIdlingI18n(IDLING_BASE_LOCALE);
      setLocaleIdState(IDLING_BASE_LOCALE);
      bumpLl();
      setLoading(false);
      try {
        writeIdlingLocaleCookie(target);
        localStorage.setItem(IDLING_UI_LOCALE_STORAGE_KEY, target);
      } catch {
        /* ignore */
      }
      return;
    }

    setLoading(true);
    try {
      await loadLocaleAsync(target as Locales);
      if (loadSeq.current !== seq) {
        return;
      }
      commitIdlingLocale(target as Locales);
      setLocaleIdState(target);
      bumpLl();
      try {
        writeIdlingLocaleCookie(target);
        localStorage.setItem(IDLING_UI_LOCALE_STORAGE_KEY, target);
      } catch {
        /* ignore */
      }
    } catch {
      if (loadSeq.current !== seq) {
        return;
      }
      initIdlingI18n(IDLING_BASE_LOCALE);
      setLocaleIdState(IDLING_BASE_LOCALE);
      bumpLl();
    } finally {
      if (loadSeq.current === seq) {
        setLoading(false);
      }
    }
  }, [bumpLl]);

  useEffect(() => {
    const stored = resolveIdlingLocaleFromStorage();
    if (!stored || stored === IDLING_BASE_LOCALE) {
      return;
    }
    const seq = ++loadSeq.current;
    void applyLocaleAsync(stored, seq);
    return () => {
      loadSeq.current += 1;
    };
  }, [applyLocaleAsync]);

  const setLocaleId = useCallback(
    (id: IdlingLocaleId) => {
      if (id === localeId && !loading) {
        return;
      }
      const seq = ++loadSeq.current;
      void applyLocaleAsync(id, seq);
    },
    [localeId, loading, applyLocaleAsync]
  );

  const value = useMemo(
    () => ({
      localeId,
      ll: getLL(),
      loading,
      setLocaleId,
      catalog: IDLING_LOCALE_CATALOG,
    }),
    [localeId, llRevision, loading, setLocaleId]
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