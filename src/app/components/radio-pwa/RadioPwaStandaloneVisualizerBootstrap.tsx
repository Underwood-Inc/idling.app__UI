'use client';

import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { isStandalonePwa } from '@lib/radio-pwa/isStandalonePwa';
import { useLayoutEffect } from 'react';

/** Installed PWA: always open in visualizer mode; F11 stays on the dock Fullscreen button. */
export function RadioPwaStandaloneVisualizerBootstrap() {
  const { isActive, spectrumEnabled, setSpectrumEnabled, enterVisualizerMode } = useVisualizerMode();

  useLayoutEffect(() => {
    if (!isStandalonePwa()) {
      return;
    }

    if (!spectrumEnabled) {
      setSpectrumEnabled(true);
    }

    if (!isActive) {
      void enterVisualizerMode();
    }
  }, [enterVisualizerMode, isActive, setSpectrumEnabled, spectrumEnabled]);

  return null;
}
