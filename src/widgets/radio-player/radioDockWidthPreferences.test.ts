import {
  clampRadioDockWidth,
  loadRadioDockWidth,
  RADIO_DOCK_WIDTH_RANGE_PX,
  resolveRadioDockWidthMax,
  saveRadioDockWidth,
} from './radioDockWidthPreferences';

describe('radioDockWidthPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('when storage is empty, dock width defaults to auto stretch', () => {
    expect(loadRadioDockWidth()).toBeNull();
  });

  test('when a width is saved, it is clamped to the allowed range', () => {
    saveRadioDockWidth(1200);
    expect(loadRadioDockWidth()).toBe(RADIO_DOCK_WIDTH_RANGE_PX.max);

    saveRadioDockWidth(120);
    expect(loadRadioDockWidth()).toBe(RADIO_DOCK_WIDTH_RANGE_PX.min);
  });

  test('when auto is saved, load returns null', () => {
    saveRadioDockWidth(420);
    saveRadioDockWidth(null);
    expect(loadRadioDockWidth()).toBeNull();
  });

  test('resolveRadioDockWidthMax respects viewport padding', () => {
    expect(resolveRadioDockWidthMax(400)).toBe(384);
    expect(clampRadioDockWidth(384)).toBe(384);
  });
});
