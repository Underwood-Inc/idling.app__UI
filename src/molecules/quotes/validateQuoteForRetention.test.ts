import { test, expect } from 'vitest';

import { formatTickerLine } from './idlingMessageTickerCatalog';
import type { IdlingQuoteRecord } from './idlingQuoteTypes';
import { quoteTextHash } from './quoteTextHash';
import { validateQuoteForRetention } from './validateQuoteForRetention';

test('validateQuoteForRetention accepts attributed Buddha verse', () => {
  const result = validateQuoteForRetention({
    text: 'Not to commit any sin, to do good, and to purify one\'s mind, that is the teaching of the Awakened.',
    author: 'The Buddha',
    sourceTitle: 'The Dhammapada',
    sourceLocator: 'Dhp 183',
    provenanceProvider: 'urantia-dhammapada',
    provenanceExternalId: '183',
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.record.attribution).toContain('The Buddha');
    expect(result.record.textHash).toBe(quoteTextHash(result.record.text));
  }
});

test('validateQuoteForRetention rejects missing author', () => {
  const result = validateQuoteForRetention({
    text: 'Walk gently upon the earth.',
    sourceTitle: 'Unknown',
    provenanceProvider: 'test',
  });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.reason).toBe('missing_author');
  }
});

test('formatTickerLine joins text and attribution', () => {
  const record: IdlingQuoteRecord = {
    id: 'test-1',
    locale: 'en',
    text: 'Peace comes from within.',
    author: 'The Buddha',
    sourceTitle: 'Dhammapada',
    attribution: 'The Buddha, Dhammapada',
    textHash: 'abc',
    provenanceProvider: 'test',
  };
  expect(formatTickerLine(record)).toBe(
    'Peace comes from within. — The Buddha, Dhammapada'
  );
});