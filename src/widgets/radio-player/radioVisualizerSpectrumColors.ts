import type { ConstructorOptions } from 'audiomotion-analyzer';
import {
  DEFAULT_RADIO_VISUALIZER_GRADIENT_ID,
  isRegisteredRadioVisualizerGradient,
  type RadioVisualizerGradientId,
} from './radioVisualizerGradients';

export interface RadioSpectrumGradientOverrides {
  [presetId: string]: RadioVisualizerGradientId | undefined;
}

export const RADIO_SPECTRUM_PRESET_DEFAULT_GRADIENTS: Record<string, RadioVisualizerGradientId> = {
  'radial-prism': 'idling-gold',
  'octave-classic': 'idling-gold',
  'mirror-rainbow': 'idling-teal',
  'led-orangered': 'idling-ember',
  'graph-steel': 'idling-gold',
  'dual-steel-prism': 'idling-gold',
};

export const RADIO_SPECTRUM_GRADIENT_PICKER_PRESET_IDS = new Set([
  'radial-prism',
  'octave-classic',
  'mirror-rainbow',
  'led-orangered',
  'graph-steel',
  'dual-steel-prism',
]);

export function isRadioSpectrumGradientPickerPreset(presetId: string): boolean {
  return RADIO_SPECTRUM_GRADIENT_PICKER_PRESET_IDS.has(presetId);
}

export function resolveSpectrumGradientForPreset(
  presetId: string,
  overrides: RadioSpectrumGradientOverrides
): RadioVisualizerGradientId {
  const override = overrides[presetId];
  if (override && isRegisteredRadioVisualizerGradient(override)) {
    return override;
  }

  return RADIO_SPECTRUM_PRESET_DEFAULT_GRADIENTS[presetId] ?? DEFAULT_RADIO_VISUALIZER_GRADIENT_ID;
}

export interface RadioSpectrumGradientSetOptions {
  gradient: RadioVisualizerGradientId;
  gradientLeft?: RadioVisualizerGradientId;
  gradientRight?: RadioVisualizerGradientId;
}

export function buildSpectrumGradientSetOptions(
  presetId: string,
  gradientId: RadioVisualizerGradientId
): RadioSpectrumGradientSetOptions {
  if (presetId === 'dual-steel-prism') {
    const defaultRight: RadioVisualizerGradientId = 'idling-teal';
    const useSplitDefault =
      gradientId === RADIO_SPECTRUM_PRESET_DEFAULT_GRADIENTS['dual-steel-prism'];

    return {
      gradient: gradientId,
      gradientLeft: gradientId,
      gradientRight: useSplitDefault ? defaultRight : gradientId,
    };
  }

  return { gradient: gradientId };
}

export function toAudioMotionGradientOptions(
  gradientOptions: RadioSpectrumGradientSetOptions
): Partial<ConstructorOptions> {
  if (gradientOptions.gradientLeft && gradientOptions.gradientRight) {
    return {
      gradient: gradientOptions.gradient,
      gradientLeft: gradientOptions.gradientLeft,
      gradientRight: gradientOptions.gradientRight,
    };
  }

  return { gradient: gradientOptions.gradient };
}

export function normalizeRadioSpectrumGradientOverrides(
  value: unknown
): RadioSpectrumGradientOverrides {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const overrides: RadioSpectrumGradientOverrides = {};
  for (const [presetId, gradientId] of Object.entries(value as Record<string, unknown>)) {
    if (isRegisteredRadioVisualizerGradient(gradientId)) {
      overrides[presetId] = gradientId;
    }
  }

  return overrides;
}
