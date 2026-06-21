import {
  ambientAudioReactivityPercentToIntensity,
  clampAmbientAudioReactivityPercent,
  parseAmbientAudioReactivityPercent,
} from './ambientAudioReactivity';

test('clampAmbientAudioReactivityPercent keeps values within 0-100', () => {
  expect(clampAmbientAudioReactivityPercent(-12)).toBe(0);
  expect(clampAmbientAudioReactivityPercent(42.6)).toBe(43);
  expect(clampAmbientAudioReactivityPercent(140)).toBe(100);
});

test('parseAmbientAudioReactivityPercent returns null for invalid storage values', () => {
  expect(parseAmbientAudioReactivityPercent({ raw: null })).toBeNull();
  expect(parseAmbientAudioReactivityPercent({ raw: 'abc' })).toBeNull();
  expect(parseAmbientAudioReactivityPercent({ raw: '55' })).toBe(55);
});

test('ambientAudioReactivityPercentToIntensity maps percent to 0-1', () => {
  expect(ambientAudioReactivityPercentToIntensity(0)).toBe(0);
  expect(ambientAudioReactivityPercentToIntensity(100)).toBe(1);
  expect(ambientAudioReactivityPercentToIntensity(50)).toBe(0.5);
});
