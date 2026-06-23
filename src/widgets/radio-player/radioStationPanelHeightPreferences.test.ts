import {
  clampRadioStationPanelHeight,
  resolveRadioStationPanelHeightMax,
} from './radioStationPanelHeightPreferences';

describe('radioStationPanelHeightPreferences', () => {
  test('when the viewport is short, the station panel height cap follows the viewport ratio', () => {
    expect(resolveRadioStationPanelHeightMax(600)).toBe(492);
  });

  test('when a stored height exceeds the cap, it is clamped down', () => {
    expect(clampRadioStationPanelHeight(1200, 700)).toBe(574);
  });

  test('when a stored height is below the minimum, it is clamped up', () => {
    expect(clampRadioStationPanelHeight(120, 900)).toBe(280);
  });
});
