'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { RadioBarVisualizerFullscreen } from './RadioBarVisualizerFullscreen';
import { RadioVisualizerFullscreen } from './RadioVisualizerFullscreen';
import { RADIO_VISUALIZER_PRESETS } from '@widgets/radio-player/radioVisualizerPresets';
import styles from './VisualizerMode.module.css';

export function VisualizerModeOverlay() {
  const {
    isActive,
    spectrumPresetIndex,
    spectrumEnabled,
    spectrumOpacity,
    spectrumBarHeight,
    fullscreenSource,
  } = useVisualizerMode();
  const { isAvailable } = useRadioPlayer();

  const activePreset =
    RADIO_VISUALIZER_PRESETS[spectrumPresetIndex] ?? RADIO_VISUALIZER_PRESETS[0];
  const showSpectrum = spectrumEnabled && fullscreenSource === 'spectrum';
  const showBar = spectrumEnabled && fullscreenSource === 'bar';

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
      />
      <RadioBarVisualizerFullscreen
        isActive={isActive}
        enabled={showBar}
        opacity={spectrumOpacity}
        barHeight={spectrumBarHeight}
      />
      {!isAvailable ? (
        <p className={styles.overlay__emptyState} data-testid="visualizer-mode-overlay">
          Start the radio from the bottom player when stations are reachable, then open fullscreen
          again.
        </p>
      ) : null}
    </>
  );
}
