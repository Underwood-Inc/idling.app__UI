'use client';

import {
  exitDocumentFullscreen,
  isDocumentFullscreen,
  requestDocumentFullscreen,
} from '@lib/fullscreen/documentFullscreen';
import { usePersistedRadioFullscreenDisplay } from '@lib/hooks/usePersistedRadioFullscreenDisplay';
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
  spectrumEnabled: boolean;
  setSpectrumEnabled: (enabled: boolean) => void;
  spectrumOpacity: number;
  setSpectrumOpacity: (opacity: number) => void;
  spectrumBarHeight: number;
  setSpectrumBarHeight: (barHeight: number) => void;
  enterVisualizerMode: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  exitVisualizerMode: () => Promise<void>;
}

const VisualizerModeContext = createContext<VisualizerModeContextValue | null>(null);

export interface VisualizerModeProviderProps {
  children: ReactNode;
}

export function VisualizerModeProvider({ children }: VisualizerModeProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const {
    display,
    setSpectrumEnabled,
    setSpectrumOpacity,
    setSpectrumPresetIndex,
    setSpectrumBarHeight,
  } = usePersistedRadioFullscreenDisplay();

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

  const exitVisualizerMode = useCallback(async () => {
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
      spectrumEnabled: display.enabled,
      setSpectrumEnabled,
      spectrumOpacity: display.opacity,
      setSpectrumOpacity,
      spectrumBarHeight: display.spectrumBarHeight,
      setSpectrumBarHeight,
      enterVisualizerMode,
      exitFullscreen,
      exitVisualizerMode,
    }),
    [
      display.enabled,
      display.opacity,
      display.presetIndex,
      display.spectrumBarHeight,
      enterVisualizerMode,
      exitFullscreen,
      exitVisualizerMode,
      isActive,
      isFullscreen,
      setSpectrumEnabled,
      setSpectrumOpacity,
      setSpectrumPresetIndex,
      setSpectrumBarHeight,
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
