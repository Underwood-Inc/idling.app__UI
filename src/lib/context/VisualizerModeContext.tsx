'use client';

import {
  exitDocumentFullscreen,
  isDocumentFullscreen,
  requestDocumentFullscreen,
} from '@lib/fullscreen/documentFullscreen';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { VisualizerModeOverlay } from '../../app/components/visualizer-mode/VisualizerModeOverlay';

export interface VisualizerModeContextValue {
  isActive: boolean;
  isFullscreen: boolean;
  spectrumPresetIndex: number;
  setSpectrumPresetIndex: (index: number) => void;
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
  const [spectrumPresetIndex, setSpectrumPresetIndex] = useState(0);

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
      spectrumPresetIndex,
      setSpectrumPresetIndex,
      enterVisualizerMode,
      exitFullscreen,
      exitVisualizerMode,
    }),
    [
      enterVisualizerMode,
      exitFullscreen,
      exitVisualizerMode,
      isActive,
      isFullscreen,
      spectrumPresetIndex,
    ]
  );

  return (
    <VisualizerModeContext.Provider value={value}>
      {children}
      {isActive ? <VisualizerModeOverlay /> : null}
    </VisualizerModeContext.Provider>
  );
}

export function useVisualizerMode(): VisualizerModeContextValue {
  const context = useContext(VisualizerModeContext);

  if (!context) {
    throw new Error('useVisualizerMode must be used within VisualizerModeProvider');
  }

  return context;
}
