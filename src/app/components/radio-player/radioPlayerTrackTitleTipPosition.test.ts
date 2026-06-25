import {
  resolveRadioPlayerTrackTitleTipMaxSize,
  resolveRadioPlayerTrackTitleTipPosition,
} from './radioPlayerTrackTitleTipPosition';

describe('radioPlayerTrackTitleTipPosition', () => {
  test('when the dock sits at the bottom, the tip prefers opening above the track title', () => {
    const result = resolveRadioPlayerTrackTitleTipPosition({
      trigger: { top: 720, left: 120, width: 180, height: 20 },
      tip: { top: 0, left: 0, width: 240, height: 64 },
      viewport: { width: 1280, height: 800 },
    });

    expect(result.placement).toBe('above');
    expect(result.top).toBe(648);
    expect(result.left).toBe(90);
  });

  test('when there is more room below, the tip opens beneath the trigger', () => {
    const result = resolveRadioPlayerTrackTitleTipPosition({
      trigger: { top: 40, left: 80, width: 160, height: 18 },
      tip: { top: 0, left: 0, width: 200, height: 48 },
      viewport: { width: 1024, height: 768 },
    });

    expect(result.placement).toBe('below');
    expect(result.top).toBe(66);
  });

  test('when centered placement overflows, the tip clamps inside the viewport margins', () => {
    const result = resolveRadioPlayerTrackTitleTipPosition({
      trigger: { top: 400, left: 12, width: 80, height: 20 },
      tip: { top: 0, left: 0, width: 300, height: 60 },
      viewport: { width: 320, height: 640 },
      margin: 8,
    });

    expect(result.left).toBe(8);
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.top + 60).toBeLessThanOrEqual(632);
  });

  test('when sizing the tip body, width and height stay within viewport caps', () => {
    expect(resolveRadioPlayerTrackTitleTipMaxSize({ width: 2000, height: 1200 })).toEqual({
      maxWidth: 416,
      maxHeight: 192,
    });

    expect(resolveRadioPlayerTrackTitleTipMaxSize({ width: 360, height: 640 })).toEqual({
      maxWidth: 331,
      maxHeight: 192,
    });
  });
});
