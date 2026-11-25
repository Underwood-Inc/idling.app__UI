import { test, expect } from 'vitest';

import { getLL, getLocale, initIdlingI18nAsync, setIdlingLocale } from './idling-i18n';

test('when Spanish is loaded async, document lang and strings match the Mappy/Overlane pattern', async () => {
  await initIdlingI18nAsync('es');
  expect(getLocale()).toBe('es');
  expect(getLL().common.actions.loading().length).toBeGreaterThan(0);
  expect(getLL().common.actions.loading()).not.toBe('Loading..');
  if (typeof document !== 'undefined') {
    expect(document.documentElement.lang).toBe('es');
    expect(document.documentElement.dir).toBe('ltr');
  }
});

test('when German is loaded via setIdlingLocale, strings resolve without stub prefixes', async () => {
  await setIdlingLocale('de');
  expect(getLocale()).toBe('de');
  expect(getLL().common.actions.loading()).not.toMatch(/^\[de\]/);
});

test('when Arabic is loaded async, document direction is rtl', async () => {
  await initIdlingI18nAsync('ar');
  expect(getLocale()).toBe('ar');
  if (typeof document !== 'undefined') {
    expect(document.documentElement.dir).toBe('rtl');
  }
});