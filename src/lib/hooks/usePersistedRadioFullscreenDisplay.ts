import { useCallback, useEffect, useState } from 'react';
import type { RadioFullscreenVisualizerDisplay } from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import {
  clampRadioFullscreenVisualizerOpacity,
  clampRadioFullscreenSpectrumBarHeight,
  DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY,
  loadRadioFullscreenVisualizerDisplay,
  saveRadioFullscreenVisualizerDisplay,
} from '@widgets/radio-player/radioFullscreenVisualizerDisplay';

export interface UsePersistedRadioFullscreenDisplayResult {
  display: RadioFullscreenVisualizerDisplay;
  isLoaded: boolean;
  setSpectrumEnabled: (enabled: boolean) => void;
  setSpectrumOpacity: (opacity: number) => void;
  setSpectrumPresetIndex: (index: number) => void;
  setSpectrumBarHeight: (barHeight: number) => void;
}

export function usePersistedRadioFullscreenDisplay(): UsePersistedRadioFullscreenDisplayResult {
  const [display, setDisplay] = useState<RadioFullscreenVisualizerDisplay>(
    DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setDisplay(loadRadioFullscreenVisualizerDisplay());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveRadioFullscreenVisualizerDisplay(display);
  }, [display, isLoaded]);

  const setSpectrumEnabled = useCallback((enabled: boolean) => {
    setDisplay((current) => ({ ...current, enabled }));
  }, []);

  const setSpectrumOpacity = useCallback((opacity: number) => {
    setDisplay((current) => ({
      ...current,
      opacity: clampRadioFullscreenVisualizerOpacity(opacity),
    }));
  }, []);

  const setSpectrumPresetIndex = useCallback((presetIndex: number) => {
    setDisplay((current) => ({
      ...current,
      enabled: true,
      presetIndex: Math.max(0, Math.floor(presetIndex)),
    }));
  }, []);

  const setSpectrumBarHeight = useCallback((spectrumBarHeight: number) => {
    setDisplay((current) => ({
      ...current,
      spectrumBarHeight: clampRadioFullscreenSpectrumBarHeight(spectrumBarHeight),
    }));
  }, []);

  return {
    display,
    isLoaded,
    setSpectrumEnabled,
    setSpectrumOpacity,
    setSpectrumPresetIndex,
    setSpectrumBarHeight,
  };
}
