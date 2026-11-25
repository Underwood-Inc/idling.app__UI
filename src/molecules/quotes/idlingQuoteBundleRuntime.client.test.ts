import { test, expect } from 'vitest';

import {
  ensureQuoteBundleReady,
  getRandomQuoteFromBundle,
} from './idlingQuoteBundleRuntime';

test('when English is bundled, sync pick returns a quote without async ensure', () => {
  const record = getRandomQuoteFromBundle('en');
  expect(record?.text?.length).toBeGreaterThan(0);
});

test('when ensureQuoteBundleReady is called, English pick still works', async () => {
  await ensureQuoteBundleReady();
  const record = getRandomQuoteFromBundle('en');
  expect(record?.text?.length).toBeGreaterThan(0);
});