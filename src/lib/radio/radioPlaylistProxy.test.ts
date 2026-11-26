import { isFetchableRadioPlaylistUrl } from './radioPlaylistProxy';

describe('radioPlaylistProxy', () => {
  test('allows public http and https playlist urls', () => {
    expect(isFetchableRadioPlaylistUrl('https://www.morow.com/morow.pls')).toBe(true);
    expect(isFetchableRadioPlaylistUrl('http://radio.example.com/listen.m3u')).toBe(true);
  });

  test('rejects private, local, and credentialed urls', () => {
    expect(isFetchableRadioPlaylistUrl('http://127.0.0.1/listen.pls')).toBe(false);
    expect(isFetchableRadioPlaylistUrl('http://10.0.0.5/listen.pls')).toBe(false);
    expect(isFetchableRadioPlaylistUrl('http://192.168.1.2/listen.pls')).toBe(false);
    expect(isFetchableRadioPlaylistUrl('http://localhost/listen.pls')).toBe(false);
    expect(isFetchableRadioPlaylistUrl('file:///etc/passwd')).toBe(false);
    expect(isFetchableRadioPlaylistUrl('https://user:pass@radio.example.com/a.pls')).toBe(false);
    expect(isFetchableRadioPlaylistUrl('not a url')).toBe(false);
  });
});
