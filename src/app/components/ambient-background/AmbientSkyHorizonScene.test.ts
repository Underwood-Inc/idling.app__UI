import { describe, expect, test } from 'vitest';
import {
  AMBIENT_HORIZON_WATER_RATIO_VAR,
  buildAmbientHorizonClipStyle,
} from './AmbientSkyHorizonScene';
import { STARRY_HORIZON_Y } from '@widgets/radio-player/webgl/renderers/createStarryHorizonRenderer';

describe('buildAmbientHorizonClipStyle', () => {
  test('exports a unitless water ratio aligned with the WebGL horizon uniform', () => {
    const style = buildAmbientHorizonClipStyle(STARRY_HORIZON_Y);

    expect(style[AMBIENT_HORIZON_WATER_RATIO_VAR]).toBe(String(STARRY_HORIZON_Y));
    expect(style['--ambient-horizon-clip-bottom']).toBe('34.0000%');
  });
});
