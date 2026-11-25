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
  resolveIdlingLocale,
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
 * Same orchestration as Mappy {@link SiteLocaleContext}: `loadLocaleAsync('en')` →
 * `commitIdlingLocale`, React state for `localeId` + `ll`, no global subscriber bus.
 */
export function IdlingLocaleProvider({ children }: { children: ReactNode }) {
  const [localeId, setLocaleIdState] = useState<IdlingLocaleId>(IDLING_BASE_LOCALE);
  /** Bumped after each successful `commitIdlingLocale` so context re-reads module `getLL()`. */
  const [llTick, setLlTick] = useState(0);
  const loadSeq = useRef(0);

  useEffect(() => {
    const stored = resolveIdlingLocale();
    if (stored !== IDLING_BASE_LOCALE) {
      setLocaleIdState(stored);
    }
  }, []);

  useEffect(() => {
    const seq = ++loadSeq.current;
    const target = localeId;

    void (async () => {
      try {
        await loadLocaleAsync('en');
        if (loadSeq.current !== seq) {
          return;
        }
        await loadLocaleAsync(target as Locales);
        if (loadSeq.current !== seq) {
          return;
        }
        commitIdlingLocale(target as Locales);
        setLlTick((tick) => tick + 1);
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
        setLlTick((tick) => tick + 1);
      }
    })();

    return () => {
      loadSeq.current += 1;
    };
  }, [localeId]);

  const setLocaleId = useCallback((id: IdlingLocaleId) => {
    if (id === localeId) {
      return;
    }
    setLocaleIdState(id);
  }, [localeId]);

  const value = useMemo(
    () => ({
      localeId,
      ll: getLL(),
      loading: false,
      setLocaleId,
      catalog: IDLING_LOCALE_CATALOG,
    }),
    [localeId, llTick, setLocaleId]
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