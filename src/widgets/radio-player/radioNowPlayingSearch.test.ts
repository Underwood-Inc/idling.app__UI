import {
  buildRadioNowPlayingSearchUrl,
  isUsableRadioNowPlayingSearchDisplay,
  resolveRadioNowPlayingSearchQuery,
} from './radioNowPlayingSearch';

describe('radioNowPlayingSearch', () => {
  test('when artist and title are present, search query combines both', () => {
    expect(
      resolveRadioNowPlayingSearchQuery({
        display: 'Future Trad Collective — Las Palmas',
        artist: 'Future Trad Collective',
        title: 'Las Palmas',
      })
    ).toBe('Future Trad Collective Las Palmas');
  });

  test('when only stream display is usable, search query uses the display text', () => {
    expect(
      resolveRadioNowPlayingSearchQuery({
        display: 'Artist — Track Name',
        artist: null,
        title: null,
      })
    ).toBe('Artist — Track Name');
  });

  test('when display is a placeholder, search query is not offered', () => {
    expect(
      resolveRadioNowPlayingSearchQuery({
        display: 'Listening…',
        artist: null,
        title: null,
      })
    ).toBeNull();
    expect(isUsableRadioNowPlayingSearchDisplay('Listening...')).toBe(false);
  });

  test('when building a search url, query text is encoded for the browser', () => {
    expect(
      buildRadioNowPlayingSearchUrl({ query: 'Future Trad Collective Las Palmas' })
    ).toBe('https://www.google.com/search?q=Future%20Trad%20Collective%20Las%20Palmas');
  });
});
