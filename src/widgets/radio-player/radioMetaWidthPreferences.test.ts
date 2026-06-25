import {
  clampRadioMetaWidth,
  loadRadioMetaWidth,
  RADIO_META_WIDTH_RANGE_PX,
  resolveRadioMetaWidthMax,
  saveRadioMetaWidth,
} from './radioMetaWidthPreferences';

describe('radioMetaWidthPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('when storage is empty, meta width defaults to auto layout', () => {
    expect(loadRadioMetaWidth()).toBeNull();
  });

  test('when a width is saved, it is clamped to the allowed range for the row', () => {
    saveRadioMetaWidth(900);
    expect(
      clampRadioMetaWidth({
        widthPx: loadRadioMetaWidth() ?? 0,
        rowWidthPx: 1200,
      })
    ).toBe(RADIO_META_WIDTH_RANGE_PX.max);
  });

  test('fullscreen mode allows a wider text column than dock mode', () => {
    const rowWidthPx = 1200;
    const dockMax = resolveRadioMetaWidthMax({ rowWidthPx, isFullscreen: false });
    const fullscreenMax = resolveRadioMetaWidthMax({ rowWidthPx, isFullscreen: true });

    expect(fullscreenMax).toBeGreaterThan(dockMax);
  });

  test('resolveRadioMetaWidthMax leaves room for controls on narrow rows', () => {
    expect(resolveRadioMetaWidthMax({ rowWidthPx: 400 })).toBe(170);
    expect(resolveRadioMetaWidthMax({ rowWidthPx: 1200 })).toBe(RADIO_META_WIDTH_RANGE_PX.max);
  });

  test('when auto is saved, load returns null', () => {
    saveRadioMetaWidth(240);
    saveRadioMetaWidth(null);
    expect(loadRadioMetaWidth()).toBeNull();
  });
});
