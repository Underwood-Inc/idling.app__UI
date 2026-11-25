import { test, expect } from 'vitest';

import type { Locales } from './i18n-types';
import { loadedLocales } from './i18n-util';
import { loadBundledEnIfNeeded, tryLoadBundledLocaleSync } from './idling-sync-en';

test('when bundled German is requested sync-first, only English is loaded until async runs', () => {
  for (const key of Object.keys(loadedLocales) as Locales[]) {
    delete loadedLocales[key];
  }
  const deReady = tryLoadBundledLocaleSync('de');
  expect(deReady).toBe(false);
  expect(loadedLocales.en).toBeDefined();
  expect(loadedLocales.de).toBeUndefined();
});

test('when English is requested sync-first, the English catalog is ready', () => {
  loadBundledEnIfNeeded();
  expect(tryLoadBundledLocaleSync('en')).toBe(true);
  expect(loadedLocales.en).toBeDefined();
});