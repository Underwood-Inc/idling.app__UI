import { parseHumanFriendlySearchQuery } from './parseHumanFriendlySearchQuery';

describe('parseHumanFriendlySearchQuery', () => {
  test('when a listener searches with quoted phrases, each phrase stays one term', () => {
    const query = parseHumanFriendlySearchQuery('"Radio France" groove');

    expect(query.terms).toEqual([
      { kind: 'text', raw: '"Radio France"', value: 'radio france' },
      { kind: 'text', raw: 'groove', value: 'groove' },
    ]);
  });

  test('when a listener uses a hashtag token, it is parsed as a genre-style filter term', () => {
    const query = parseHumanFriendlySearchQuery('#electronic london');

    expect(query.terms).toEqual([
      { kind: 'hashtag', raw: '#electronic', value: 'electronic' },
      { kind: 'text', raw: 'london', value: 'london' },
    ]);
  });

  test('when the query is blank, no search terms are produced', () => {
    expect(parseHumanFriendlySearchQuery('   ').terms).toEqual([]);
  });
});
