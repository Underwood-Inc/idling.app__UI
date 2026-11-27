import { resolveRadioStationStreamUrl } from './resolveRadioStationStreamUrl';

test('when a station name is blank, resolveRadioStationStreamUrl returns null', () => {
  expect(resolveRadioStationStreamUrl('')).toBeNull();
  expect(resolveRadioStationStreamUrl('   ')).toBeNull();
});

test('when a station name is unknown, resolveRadioStationStreamUrl returns null', () => {
  expect(resolveRadioStationStreamUrl('Not A Real Station Name 9999')).toBeNull();
});