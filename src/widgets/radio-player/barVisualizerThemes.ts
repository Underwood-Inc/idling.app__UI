import type { BarVisualizerTheme } from './barVisualizer.types';

export const IDLING_BAR_VISUALIZER_THEME: BarVisualizerTheme = {
  id: 'idling',
  label: 'Idling',
  primary: { r: 229, g: 193, b: 133 },
  secondary: { r: 116, g: 168, b: 132 },
  glow: 'rgba(229, 193, 133, 0.35)',
  canvasBg: 'rgba(229, 193, 133, 0.04)',
};

/** Brand palette for bar visualizer rendering — not user-selectable. */
export function getBarVisualizerTheme(): BarVisualizerTheme {
  return IDLING_BAR_VISUALIZER_THEME;
}
