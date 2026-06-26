import type { WebglVisualizerPresetDefinition } from './webglVisualizer.types';
import { createLiquidMergeRenderer } from './renderers/createLiquidMergeRenderer';
import { createMirrorBarsRenderer } from './renderers/createMirrorBarsRenderer';
import { createNeonConstellationRenderer } from './renderers/createNeonConstellationRenderer';
import { createNetrunnerGridRenderer } from './renderers/createNetrunnerGridRenderer';
import { createRadialSpectrumRenderer } from './renderers/createRadialSpectrumRenderer';
import { createStarryHorizonRenderer } from './renderers/createStarryHorizonRenderer';
import { createSpectrumBarsRenderer } from './renderers/createSpectrumBarsRenderer';
import { createWaveformPathRenderer } from './renderers/createWaveformPathRenderer';

export const WEBGL_DEFAULT_PRESET_ID = 'spectrum-bars';

const LEGACY_WEBGL_PRESET_ID_MAP: Record<string, string> = {
  'aurora-flow': 'spectrum-bars',
  'nebula-chamber': 'liquid-merge',
  'kaleidoscope-prism': 'neon-constellation',
  'kaleidoscope': 'neon-constellation',
  'silk-tide': 'spectrum-bars',
  'lissajous-glow': 'waveform-path',
  'constellation-weave': 'neon-constellation',
  'waveform-scope': 'waveform-path',
  'radial-bars': 'radial-spectrum',
  'mirror-bars': 'mirror-bars',
  'plasma': 'netrunner-grid',
  'plasma-wave': 'netrunner-grid',
  'particle-orbit': 'neon-constellation',
  'bar-city': 'netrunner-grid',
  'hex-lattice': 'spectrum-bars',
  'circuit-matrix': 'spectrum-bars',
  'cyber-tunnel': 'netrunner-grid',
  'cyber-tunnel-extreme': 'spectrum-bars',
  'bar-city-extreme': 'spectrum-bars',
  'netrunner-grid-extreme': 'spectrum-bars',
  'idling-radio-tunnel': 'spectrum-bars',
  'neon-cube-avenue': 'spectrum-bars',
  'ripple-pool': 'starry-horizon',
  'mirror-lake': 'starry-horizon',
  'eq-horizon': 'starry-horizon',
  'spectrum-bloom': 'radial-spectrum',
};

export const WEBGL_VISUALIZER_PRESETS: WebglVisualizerPresetDefinition[] = [
  {
    id: 'netrunner-grid',
    label: 'Netrunner grid',
    description: '3D cyber avenue — neon towers on both sides over a scrolling grid',
    createRenderer: createNetrunnerGridRenderer,
  },
  {
    id: 'starry-horizon',
    label: 'Starry horizon',
    description: 'Gold-to-teal EQ skyline on a low horizon — starry night mirrored in calm water',
    createRenderer: createStarryHorizonRenderer,
  },
  {
    id: 'spectrum-bars',
    label: 'Spectrum bars',
    description: 'Classic full-width EQ columns',
    createRenderer: createSpectrumBarsRenderer,
  },
  {
    id: 'mirror-bars',
    label: 'Mirror bars',
    description: 'Symmetric spectrum columns from center',
    createRenderer: createMirrorBarsRenderer,
  },
  {
    id: 'radial-spectrum',
    label: 'Radial spectrum',
    description: 'Large circular analyzer filling the screen',
    createRenderer: createRadialSpectrumRenderer,
  },
  {
    id: 'waveform-path',
    label: 'Waveform path',
    description: 'Oscilloscope stroke with phosphor trail',
    createRenderer: createWaveformPathRenderer,
  },
  {
    id: 'liquid-merge',
    label: 'Liquid merge',
    description: 'Slow drifting color blobs that stretch, meet, and merge as they cross the screen',
    createRenderer: createLiquidMergeRenderer,
  },
  {
    id: 'neon-constellation',
    label: 'Neon constellation',
    description: 'Spherical neon mesh whose vertices and links morph with the music',
    createRenderer: createNeonConstellationRenderer,
  },
];

export function normalizeWebglVisualizerPresetId(presetId: string): string {
  if (WEBGL_VISUALIZER_PRESETS.some((preset) => preset.id === presetId)) {
    return presetId;
  }

  const legacy = LEGACY_WEBGL_PRESET_ID_MAP[presetId];
  if (legacy) {
    return legacy;
  }

  return WEBGL_DEFAULT_PRESET_ID;
}

export function getWebglVisualizerPresetDefinition(
  presetId: string
): WebglVisualizerPresetDefinition {
  const normalized = normalizeWebglVisualizerPresetId(presetId);
  return (
    WEBGL_VISUALIZER_PRESETS.find((preset) => preset.id === normalized) ??
    WEBGL_VISUALIZER_PRESETS[0]
  );
}

export function webglVisualizerPresetUsesWaveform(presetId: string): boolean {
  return normalizeWebglVisualizerPresetId(presetId) === 'waveform-path';
}
