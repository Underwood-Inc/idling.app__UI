import { buildHumanFriendlySearchHighlightSegments } from './buildHumanFriendlySearchHighlightSegments';
import { parseHumanFriendlySearchQuery } from './parseHumanFriendlySearchQuery';

describe('buildHumanFriendlySearchHighlightSegments', () => {
  test('when search terms appear in station text, the matching spans are marked', () => {
    const query = parseHumanFriendlySearchQuery('groove france');
    const segments = buildHumanFriendlySearchHighlightSegments('FIP Groove from Radio France', query);

    expect(segments).toEqual([
      { text: 'FIP ', matched: false },
      { text: 'Groove', matched: true },
      { text: ' from Radio ', matched: false },
      { text: 'France', matched: true },
    ]);
  });
});
