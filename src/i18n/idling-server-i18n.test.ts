/** @vitest-environment node */
import { test, expect } from 'vitest';

import { getLL, initIdlingI18nAsync } from './idling-i18n';
import { loadLocaleAsync } from './i18n-util.async';

test('when metadata loads English like getServerLL fallback, home masthead line is defined', async () => {
  await loadLocaleAsync('en');
  await initIdlingI18nAsync('en');
  expect(getLL().home.masthead.line().length).toBeGreaterThan(0);
});