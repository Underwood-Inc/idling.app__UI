import { renderHook, waitFor } from '@testing-library/react';
import { RADIO_EN } from '$i18n-source/radio.en';
import { initIdlingI18nAsync, setIdlingLocale } from '$i18n/idling-i18n';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { getLL } from '$i18n/idling-i18n';
import type { ReactNode } from 'react';
import { IdlingLocaleProvider } from '../locale/IdlingLocaleProvider';
import { useRadioCopy } from './useRadioCopy';

function wrapper({ children }: { children: ReactNode }) {
  return <IdlingLocaleProvider>{children}</IdlingLocaleProvider>;
}

describe('useRadioCopy locale switching', () => {
  test('when locale changes to zh, press play copy resolves from ll.radio not English fallback', async () => {
    await initIdlingI18nAsync('en');
    const enCopy = resolveCatalogFromLl(RADIO_EN, getLL().radio as Record<string, unknown>);
    expect(enCopy.bar.pressPlayToStart).toBe(RADIO_EN.bar.pressPlayToStart);

    await setIdlingLocale('zh');
    expect(typeof getLL().radio.bar).toBe('function');
    expect(getLL().radio.bar.pressPlayToStart()).not.toBe(RADIO_EN.bar.pressPlayToStart);
    const zhCopy = resolveCatalogFromLl(RADIO_EN, getLL().radio as Record<string, unknown>);
    expect(zhCopy.bar.pressPlayToStart).toBe(getLL().radio.bar.pressPlayToStart());
    expect(zhCopy.bar.pressPlayToStart.length).toBeGreaterThan(0);
  });

  test('when provider locale changes, hook returns updated bar copy', async () => {
    const { result } = renderHook(() => useRadioCopy(), { wrapper });
    await waitFor(() => {
      expect(result.current.bar.pressPlayToStart).toBeTruthy();
    });
    const english = result.current.bar.pressPlayToStart;

    await setIdlingLocale('zh');

    await waitFor(() => {
      expect(result.current.bar.pressPlayToStart).not.toBe(english);
    });
  });
});