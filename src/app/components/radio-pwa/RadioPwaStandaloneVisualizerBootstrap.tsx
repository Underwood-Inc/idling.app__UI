'use client';

import { isStandalonePwa } from '@lib/radio-pwa/isStandalonePwa';
import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { useEffect } from 'react';

/** Installed radio PWA always opens in fullscreen visualizer mode (no browser fullscreen). */
export function RadioPwaStandaloneVisualizerBootstrap() {
  const { isActive, spectrumEnabled, setSpectrumEnabled, enterVisualizerMode } = useVisualizerMode();

  useEffect(() => {
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
