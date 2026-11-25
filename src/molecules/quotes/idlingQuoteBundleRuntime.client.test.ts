import { test, expect } from 'vitest';

import {
  ensureQuoteBundleReady,
  getRandomQuoteFromBundle,
} from './idlingQuoteBundleRuntime';

test('when the quote bundle has not been loaded, sync pick returns null', () => {
  expect(getRandomQuoteFromBundle('en')).toBeNull();
});

test('when the quote bundle is loaded async, sync pick returns a quote', async () => {
  await ensureQuoteBundleReady();
  const record = getRandomQuoteFromBundle('en');
  expect(record?.text?.length).toBeGreaterThan(0);
});