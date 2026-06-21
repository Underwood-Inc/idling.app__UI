import {
  contrastRatio,
  getContrastSafeCssVars,
  parseCssColorToRgb,
  pickContrastSafeForeground,
} from './contrastSafe';

test('pickContrastSafeForeground chooses dark text on mid orange hover', () => {
  expect(pickContrastSafeForeground('#d88535')).toBe('#1a1a1a');
});

test('pickContrastSafeForeground chooses light text on light tan', () => {
  expect(pickContrastSafeForeground('#fbf2c4')).toBe('#1a1a1a');
});

test('getContrastSafeCssVars returns bg and computed foreground fallbacks', () => {
  const vars = getContrastSafeCssVars('#e59847', '#d88535');

  expect(vars['--contrast-safe-bg']).toBe('#e59847');
  expect(vars['--contrast-safe-bg-hover']).toBe('#d88535');
  expect(vars['--contrast-safe-fg']).toBe('#1a1a1a');
  expect(vars['--contrast-safe-fg-hover']).toBe('#1a1a1a');
});

test('pickContrastSafeForeground beats global anchor brown on orange hover', () => {
  const background = parseCssColorToRgb('#d88535');
  const safeForeground = parseCssColorToRgb(pickContrastSafeForeground('#d88535'));
  const anchorForeground = parseCssColorToRgb('#8b5a2b');

  expect(background).not.toBeNull();
  expect(safeForeground).not.toBeNull();
  expect(anchorForeground).not.toBeNull();

  if (!background || !safeForeground || !anchorForeground) {
    throw new Error('Expected parseable colors');
  }

  expect(contrastRatio(safeForeground, background)).toBeGreaterThan(
    contrastRatio(anchorForeground, background),
  );
});
