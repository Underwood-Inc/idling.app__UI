'use client';

import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { RADIO_VISUALIZER_PRESETS } from '@widgets/radio-player/radioVisualizerPresets';
import { RadioBarVisualizerFullscreen } from './RadioBarVisualizerFullscreen';
import { RadioVisualizerFullscreen } from './RadioVisualizerFullscreen';
import { RadioWebglVisualizerFullscreen } from './RadioWebglVisualizerFullscreen';

export function VisualizerModeOverlay() {
  const {
    isActive,
    spectrumPresetIndex,
    spectrumEnabled,
    spectrumOpacity,
    spectrumBarHeight,
    fullscreenSource,
    spectrumGradientByPreset,
    webglPresetId,
    webglConstellationMotion,
    webglVisualizerCapability,
  } = useVisualizerMode();

  const activePreset =
    RADIO_VISUALIZER_PRESETS[spectrumPresetIndex] ?? RADIO_VISUALIZER_PRESETS[0];
  const showSpectrum = spectrumEnabled && fullscreenSource === 'spectrum';
  const showBar = spectrumEnabled && fullscreenSource === 'bar';
  const showWebgl =
    spectrumEnabled &&
    fullscreenSource === 'webgl' &&
    (!webglVisualizerCapability.isResolved || webglVisualizerCapability.isSupported);

  if (!isActive) {
    return null;
  }

  return (
    <>
      <RadioVisualizerFullscreen
        isActive={isActive}
        enabled={showSpectrum}
        opacity={spectrumOpacity}
        barHeight={spectrumBarHeight}
        preset={activePreset}
        spectrumGradientByPreset={spectrumGradientByPreset}
      />
      <RadioBarVisualizerFullscreen
        isActive={isActive}
        enabled={showBar}
        opacity={spectrumOpacity}
        barHeight={spectrumBarHeight}
      />
      <RadioWebglVisualizerFullscreen
        isActive={isActive}
        enabled={showWebgl}
        opacity={spectrumOpacity}
        presetId={webglPresetId}
        constellationMotion={webglConstellationMotion}
        capability={webglVisualizerCapability}
      />
    </>
  );
}
