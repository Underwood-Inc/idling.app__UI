'use client';

import {
  exitDocumentFullscreen,
  isDocumentFullscreen,
  requestDocumentFullscreen,
} from '@lib/fullscreen/documentFullscreen';
import { isStandalonePwa } from '@lib/radio-pwa/isStandalonePwa';
import { usePersistedRadioFullscreenDisplay } from '@lib/hooks/usePersistedRadioFullscreenDisplay';
import { useWebglVisualizerCapability } from '@lib/hooks/useWebglVisualizerCapability';
import type { WebglVisualizerCapabilityState } from '@lib/hooks/useWebglVisualizerCapability';
import type { RadioFullscreenVisualizerSource } from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import type { NeonConstellationMotionMode } from '@widgets/radio-player/webgl/neonConstellationMotion.types';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface VisualizerModeContextValue {
  isActive: boolean;
  isFullscreen: boolean;
  spectrumPresetIndex: number;
  setSpectrumPresetIndex: (index: number) => void;
  fullscreenSource: RadioFullscreenVisualizerSource;
  setFullscreenSource: (source: RadioFullscreenVisualizerSource) => void;
  webglPresetId: string;
  setWebglPresetId: (presetId: string) => void;
  webglConstellationMotion: NeonConstellationMotionMode;
  setWebglConstellationMotion: (mode: NeonConstellationMotionMode) => void;
  spectrumEnabled: boolean;
  setSpectrumEnabled: (enabled: boolean) => void;
  spectrumOpacity: number;
  setSpectrumOpacity: (opacity: number) => void;
  spectrumBarHeight: number;
  setSpectrumBarHeight: (barHeight: number) => void;
  webglVisualizerCapability: WebglVisualizerCapabilityState;
  enterVisualizerMode: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleDocumentFullscreen: () => Promise<void>;
  exitVisualizerMode: () => Promise<void>;
}

const VisualizerModeContext = createContext<VisualizerModeContextValue | null>(null);

export interface VisualizerModeProviderProps {
  children: ReactNode;
}

export function VisualizerModeProvider({ children }: VisualizerModeProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const webglVisualizerCapability = useWebglVisualizerCapability();
  const {
    display,
    setSpectrumEnabled,
    setSpectrumOpacity,
    setSpectrumPresetIndex,
    setFullscreenSource,
    setWebglPresetId,
    setWebglConstellationMotion,
    setSpectrumBarHeight,
  } = usePersistedRadioFullscreenDisplay();

  const guardedSetFullscreenSource = useCallback(
    (source: RadioFullscreenVisualizerSource) => {
      if (
        source === 'webgl' &&
        webglVisualizerCapability.isResolved &&
        !webglVisualizerCapability.isSupported
      ) {
        return;
      }

      setFullscreenSource(source);
    },
    [
      setFullscreenSource,
      webglVisualizerCapability.isResolved,
      webglVisualizerCapability.isSupported,
    ]
  );

  const guardedSetWebglPresetId = useCallback(
    (presetId: string) => {
      if (webglVisualizerCapability.isResolved && !webglVisualizerCapability.isSupported) {
        return;
      }

      setWebglPresetId(presetId);
    },
    [
      setWebglPresetId,
      webglVisualizerCapability.isResolved,
      webglVisualizerCapability.isSupported,
    ]
  );

  useEffect(() => {
    if (!webglVisualizerCapability.isResolved || webglVisualizerCapability.isSupported) {
      return;
    }

    if (display.source === 'webgl') {
      setFullscreenSource('spectrum');
    }
  }, [
    display.source,
    setFullscreenSource,
    webglVisualizerCapability.isResolved,
    webglVisualizerCapability.isSupported,
  ]);

  useEffect(() => {
    document.documentElement.classList.toggle('visualizer-mode', isActive);

    return () => {
      document.documentElement.classList.remove('visualizer-mode');
    };
  }, [isActive]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(isDocumentFullscreen());
    };

    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState);
    };
  }, []);

  const enterVisualizerMode = useCallback(async () => {
    setIsActive(true);

    if (isStandalonePwa()) {
      return;
    }

    try {
      await requestDocumentFullscreen();
    } catch {
      // Visualizer still works without browser fullscreen.
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      await exitDocumentFullscreen();
    } catch {
      // Ignore exit failures — state syncs via fullscreenchange.
    }
  }, []);

  const toggleDocumentFullscreen = useCallback(async () => {
    if (isDocumentFullscreen()) {
      await exitFullscreen();
      return;
    }

    try {
      await requestDocumentFullscreen();
    } catch {
      // Fullscreen may be blocked by the browser or OS.
    }
  }, [exitFullscreen]);

  const exitVisualizerMode = useCallback(async () => {
    if (isStandalonePwa()) {
      return;
    }

    try {
      await exitDocumentFullscreen();
    } catch {
      // Continue restoring UI even if fullscreen exit fails.
    }

    setIsActive(false);
    setIsFullscreen(false);
  }, []);

  const value = useMemo<VisualizerModeContextValue>(
    () => ({
      isActive,
      isFullscreen,
      spectrumPresetIndex: display.presetIndex,
      setSpectrumPresetIndex,
      fullscreenSource: display.source,
      setFullscreenSource: guardedSetFullscreenSource,
      webglPresetId: display.webglPresetId,
      setWebglPresetId: guardedSetWebglPresetId,
      webglConstellationMotion: display.webglConstellationMotion,
      setWebglConstellationMotion,
      spectrumEnabled: display.enabled,
      setSpectrumEnabled,
      spectrumOpacity: display.opacity,
      setSpectrumOpacity,
      spectrumBarHeight: display.spectrumBarHeight,
      setSpectrumBarHeight,
      webglVisualizerCapability,
      enterVisualizerMode,
      exitFullscreen,
      toggleDocumentFullscreen,
      exitVisualizerMode,
    }),
    [
      display.enabled,
      display.opacity,
      display.presetIndex,
      display.source,
      display.webglPresetId,
      display.webglConstellationMotion,
      display.spectrumBarHeight,
      enterVisualizerMode,
      exitFullscreen,
      toggleDocumentFullscreen,
      exitVisualizerMode,
      isActive,
      isFullscreen,
      setSpectrumEnabled,
      setSpectrumOpacity,
      setSpectrumPresetIndex,
      guardedSetFullscreenSource,
      guardedSetWebglPresetId,
      setWebglConstellationMotion,
      setSpectrumBarHeight,
      webglVisualizerCapability,
    ]
  );

  return (
    <VisualizerModeContext.Provider value={value}>{children}</VisualizerModeContext.Provider>
  );
}

export function useVisualizerMode(): VisualizerModeContextValue {
  const context = useContext(VisualizerModeContext);

  if (!context) {
    throw new Error('useVisualizerMode must be used within VisualizerModeProvider');
  }

  return context;
}
