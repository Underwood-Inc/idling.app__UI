'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { RadioVisualizerFullscreen } from './RadioVisualizerFullscreen';
import { RADIO_VISUALIZER_PRESETS } from './radioVisualizerPresets';
import styles from './VisualizerMode.module.css';

export function VisualizerModeOverlay() {
  const { isActive, spectrumPresetIndex } = useVisualizerMode();
  const { isAvailable } = useRadioPlayer();

  const activePreset =
    RADIO_VISUALIZER_PRESETS[spectrumPresetIndex] ?? RADIO_VISUALIZER_PRESETS[0];

  if (!isActive) {
    return null;
  }

  return (
    <>
      <RadioVisualizerFullscreen isActive={isActive} preset={activePreset} />
      {!isAvailable ? (
        <p className={styles.overlay__emptyState} data-testid="visualizer-mode-overlay">
          Start the radio from the bottom player when stations are reachable, then open fullscreen
          again.
        </p>
      ) : null}
    </>
  );
}
