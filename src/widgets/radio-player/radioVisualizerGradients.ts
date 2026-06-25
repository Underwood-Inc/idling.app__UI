import type { GradientOptions } from 'audiomotion-analyzer';

export type RadioVisualizerGradientId =
  | 'idling-gold'
  | 'idling-teal'
  | 'idling-ember'
  | 'idling-violet';

export interface RadioVisualizerGradientOption {
  id: RadioVisualizerGradientId;
  label: string;
  swatch: string;
}

export interface RadioVisualizerGradientDefinition {
  id: RadioVisualizerGradientId;
  options: GradientOptions;
}

export const DEFAULT_RADIO_VISUALIZER_GRADIENT_ID: RadioVisualizerGradientId = 'idling-gold';

export const RADIO_VISUALIZER_GRADIENT_OPTIONS: RadioVisualizerGradientOption[] = [
  { id: 'idling-gold', label: 'Gold', swatch: '#e5c185' },
  { id: 'idling-teal', label: 'Teal', swatch: '#74a892' },
  { id: 'idling-ember', label: 'Ember', swatch: '#d48a4a' },
  { id: 'idling-violet', label: 'Violet', swatch: '#9a84c4' },
];

/** Brand-aligned gradients for fullscreen audioMotion presets. */
export const RADIO_VISUALIZER_GRADIENTS: RadioVisualizerGradientDefinition[] = [
  {
    id: 'idling-gold',
    options: {
      bgColor: '#0a0a0e',
      colorStops: [
        { color: '#2a4a40', level: 0.15 },
        { color: '#74a892', level: 0.4 },
        { color: '#e5c185', level: 0.72 },
        { color: '#f0ddb0', level: 0.92 },
      ],
    },
  },
  {
    id: 'idling-teal',
    options: {
      bgColor: '#0a0a0e',
      colorStops: ['#142822', '#3d6b5c', '#74a892', '#b8ddd0', '#e5c185'],
    },
  },
  {
    id: 'idling-ember',
    options: {
      bgColor: '#0a0a0e',
      colorStops: [
        { color: '#2a1c14', pos: 0 },
        { color: '#a86b3a', level: 0.35 },
        { color: '#e5c185', level: 0.65 },
        { color: '#ffbe7a', level: 0.9 },
      ],
    },
  },
  {
    id: 'idling-violet',
    options: {
      bgColor: '#0a0a0e',
      colorStops: ['#1e1430', '#5c4a82', '#9a84c4', '#c4b0e0', '#e5c185'],
    },
  },
];

export interface RadioVisualizerGradientRegistrar {
  registerGradient: (name: string, options: GradientOptions) => void;
}

export function registerRadioVisualizerGradients(registrar: RadioVisualizerGradientRegistrar): void {
  for (const gradient of RADIO_VISUALIZER_GRADIENTS) {
    registrar.registerGradient(gradient.id, gradient.options);
  }
}

export function isRegisteredRadioVisualizerGradient(
  gradientId: string
): gradientId is RadioVisualizerGradientId {
  return RADIO_VISUALIZER_GRADIENTS.some((gradient) => gradient.id === gradientId);
}

export function normalizeRadioVisualizerGradientId(
  value: unknown
): RadioVisualizerGradientId | null {
  if (typeof value !== 'string' || !isRegisteredRadioVisualizerGradient(value)) {
    return null;
  }

  return value;
}
