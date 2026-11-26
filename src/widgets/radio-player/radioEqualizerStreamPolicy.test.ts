import {
  accessControlAllowsEqualizer,
  equalizerStreamRejection,
} from './radioEqualizerStreamPolicy';

describe('radioEqualizerStreamPolicy', () => {
  test('accepts a wildcard or the idling.app origin', () => {
    expect(accessControlAllowsEqualizer('*')).toBe(true);
    expect(accessControlAllowsEqualizer('https://idling.app')).toBe(true);
    expect(accessControlAllowsEqualizer(' HTTPS://Idling.app ')).toBe(true);
  });

  test('rejects a missing header, another origin, and a duplicated wildcard', () => {
    expect(accessControlAllowsEqualizer(null)).toBe(false);
    expect(accessControlAllowsEqualizer('')).toBe(false);
    expect(accessControlAllowsEqualizer('https://scrobblerad.io')).toBe(false);
    expect(accessControlAllowsEqualizer('*, *')).toBe(false);
  });

  test('accepts an HTTPS stream that answered 200 or 206 with a usable CORS header', () => {
    expect(
      equalizerStreamRejection({
        finalUrl: 'https://stream.example.com/live.mp3',
        status: 200,
        accessControlAllowOrigin: '*',
      })
    ).toBeNull();
    expect(
      equalizerStreamRejection({
        finalUrl: 'https://stream.example.com/live.mp3',
        status: 206,
        accessControlAllowOrigin: 'https://idling.app',
      })
    ).toBeNull();
  });

  test('rejects HTTP audio, error statuses, and streams without equalizer CORS', () => {
    expect(
      equalizerStreamRejection({
        finalUrl: 'http://stream.example.com/live.mp3',
        status: 200,
        accessControlAllowOrigin: '*',
      })
    ).toBe('Stream URL is not HTTPS');
    expect(
      equalizerStreamRejection({
        finalUrl: 'https://stream.example.com/live.mp3',
        status: 401,
        accessControlAllowOrigin: '*',
      })
    ).toBe('HTTP 401');
    expect(
      equalizerStreamRejection({
        finalUrl: 'https://stream.example.com/live.mp3',
        status: 200,
        accessControlAllowOrigin: null,
      })
    ).toBe('Missing Access-Control-Allow-Origin for https://idling.app');
  });
});
