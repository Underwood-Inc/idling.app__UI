import type { ConstructorOptions } from 'audiomotion-analyzer';

export interface RadioVisualizerPreset {
  id: string;
  label: string;
  options: ConstructorOptions;
}

/** Shared audioMotion tuning — log scale + auto-range friendly defaults. */
export const RADIO_VISUALIZER_BASE_OPTIONS: ConstructorOptions = {
  alphaBars: true,
  ansiBands: false,
  bgAlpha: 0,
  connectSpeakers: false,
  fadePeaks: true,
  frequencyScale: 'log',
  linearAmplitude: false,
  linearBoost: 1.45,
  loRes: false,
  maxDecibels: -22,
  maxFPS: 60,
  minDecibels: -88,
  overlay: true,
  showBgColor: false,
  showPeaks: true,
  showScaleX: false,
  showScaleY: false,
  smoothing: 0.68,
  weightingFilter: 'D',
};

export const RADIO_VISUALIZER_PRESETS: RadioVisualizerPreset[] = [
  {
    id: 'radial-prism',
    label: 'Radial prism',
    options: {
      ...RADIO_VISUALIZER_BASE_OPTIONS,
      barSpace: 0.1,
      colorMode: 'gradient',
      fillAlpha: 0.7,
      gradient: 'prism',
      mode: 5,
      radial: true,
      reflexRatio: 0.5,
      roundBars: true,
    },
  },
  {
    id: 'octave-classic',
    label: 'Octave bars',
    options: {
      ...RADIO_VISUALIZER_BASE_OPTIONS,
      barSpace: 0.08,
      colorMode: 'bar-level',
      fillAlpha: 0.82,
      gradient: 'classic',
      mode: 3,
      outlineBars: false,
      radial: false,
      reflexRatio: 0.35,
      roundBars: true,
    },
  },
  {
    id: 'mirror-rainbow',
    label: 'Mirror rainbow',
    options: {
      ...RADIO_VISUALIZER_BASE_OPTIONS,
      barSpace: 0.06,
      colorMode: 'bar-index',
      fillAlpha: 0.75,
      gradient: 'rainbow',
      mirror: 1,
      mode: 6,
      radial: false,
      roundBars: true,
    },
  },
  {
    id: 'led-orangered',
    label: 'LED spectrum',
    options: {
      ...RADIO_VISUALIZER_BASE_OPTIONS,
      barSpace: 0.04,
      colorMode: 'gradient',
      gradient: 'orangered',
      ledBars: true,
      lumiBars: false,
      mode: 7,
      radial: false,
      trueLeds: true,
    },
  },
  {
    id: 'graph-steel',
    label: 'Wave graph',
    options: {
      ...RADIO_VISUALIZER_BASE_OPTIONS,
      colorMode: 'gradient',
      fillAlpha: 0.35,
      gradient: 'steelblue',
      lineWidth: 2,
      mode: 10,
      peakLine: true,
      radial: false,
      reflexRatio: 0,
      roundBars: false,
      showPeaks: true,
    },
  },
  {
    id: 'dual-steel-prism',
    label: 'Dual channel',
    options: {
      ...RADIO_VISUALIZER_BASE_OPTIONS,
      barSpace: 0.12,
      channelLayout: 'dual-combined',
      colorMode: 'gradient',
      fillAlpha: 0.68,
      gradient: 'prism',
      gradientLeft: 'steelblue',
      gradientRight: 'prism',
      mode: 4,
      radial: true,
      radius: 0.12,
      reflexRatio: 0.42,
      roundBars: true,
      splitGradient: true,
    },
  },
];

export const RADIO_FULLSCREEN_DEFAULT_PRESET_ID = 'graph-steel';

export function getRadioVisualizerPresetIndex(presetId: string): number {
  const index = RADIO_VISUALIZER_PRESETS.findIndex((preset) => preset.id === presetId);
  return index >= 0 ? index : 0;
}
