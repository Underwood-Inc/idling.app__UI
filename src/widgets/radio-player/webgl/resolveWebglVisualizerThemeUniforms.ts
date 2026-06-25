import type { BarVisualizerTheme } from '../barVisualizer.types';
import type { WebglVisualizerThemeUniforms } from './webglVisualizer.types';

export function resolveWebglVisualizerThemeUniforms(
  theme: BarVisualizerTheme
): WebglVisualizerThemeUniforms {
  return {
    primary: [theme.primary.r / 255, theme.primary.g / 255, theme.primary.b / 255],
    secondary: [theme.secondary.r / 255, theme.secondary.g / 255, theme.secondary.b / 255],
  };
}
