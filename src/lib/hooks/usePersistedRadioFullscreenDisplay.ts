import { useCallback, useEffect, useState } from 'react';
import type {
  RadioFullscreenVisualizerDisplay,
  RadioFullscreenVisualizerSource,
} from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import {
  clampRadioFullscreenVisualizerOpacity,
  clampRadioFullscreenSpectrumBarHeight,
  DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY,
  loadRadioFullscreenVisualizerDisplay,
  saveRadioFullscreenVisualizerDisplay,
} from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import { normalizeWebglVisualizerPresetId } from '@widgets/radio-player/webgl/webglVisualizerPresets';
import { normalizeNeonConstellationMotionMode } from '@widgets/radio-player/webgl/neonConstellationMotion';
import type { NeonConstellationMotionMode } from '@widgets/radio-player/webgl/neonConstellationMotion.types';

export interface UsePersistedRadioFullscreenDisplayResult {
  display: RadioFullscreenVisualizerDisplay;
  isLoaded: boolean;
  setSpectrumEnabled: (enabled: boolean) => void;
  setSpectrumOpacity: (opacity: number) => void;
  setSpectrumPresetIndex: (index: number) => void;
  setFullscreenSource: (source: RadioFullscreenVisualizerSource) => void;
  setWebglPresetId: (presetId: string) => void;
  setWebglConstellationMotion: (mode: NeonConstellationMotionMode) => void;
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
      source: 'spectrum',
      presetIndex: Math.max(0, Math.floor(presetIndex)),
    }));
  }, []);

  const setFullscreenSource = useCallback((source: RadioFullscreenVisualizerSource) => {
    setDisplay((current) => ({
      ...current,
      enabled: true,
      source,
    }));
  }, []);

  const setWebglPresetId = useCallback((presetId: string) => {
    setDisplay((current) => ({
      ...current,
      enabled: true,
      source: 'webgl',
      webglPresetId: normalizeWebglVisualizerPresetId(presetId),
    }));
  }, []);

  const setSpectrumBarHeight = useCallback((spectrumBarHeight: number) => {
    setDisplay((current) => ({
      ...current,
      spectrumBarHeight: clampRadioFullscreenSpectrumBarHeight(spectrumBarHeight),
    }));
  }, []);

  const setWebglConstellationMotion = useCallback((mode: NeonConstellationMotionMode) => {
    setDisplay((current) => ({
      ...current,
      webglConstellationMotion: normalizeNeonConstellationMotionMode(mode),
    }));
  }, []);

  return {
    display,
    isLoaded,
    setSpectrumEnabled,
    setSpectrumOpacity,
    setSpectrumPresetIndex,
    setFullscreenSource,
    setWebglPresetId,
    setWebglConstellationMotion,
    setSpectrumBarHeight,
  };
}
