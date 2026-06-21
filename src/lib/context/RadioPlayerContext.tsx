'use client';

import type { RadioPlayerHandle } from '@widgets/radio-player/radioPlayer.types';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export interface RadioPlayerContextValue {
  handle: RadioPlayerHandle | null;
  isAvailable: boolean;
  registerPlayer: (player: RadioPlayerHandle) => void;
  unregisterPlayer: () => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | null>(null);

export interface RadioPlayerProviderProps {
  children: ReactNode;
}

export function RadioPlayerProvider({ children }: RadioPlayerProviderProps) {
  const [handle, setHandle] = useState<RadioPlayerHandle | null>(null);

  const registerPlayer = useCallback((player: RadioPlayerHandle) => {
    setHandle(player);
  }, []);

  const unregisterPlayer = useCallback(() => {
    setHandle(null);
  }, []);

  const value = useMemo<RadioPlayerContextValue>(
    () => ({
      handle,
      isAvailable: handle !== null,
      registerPlayer,
      unregisterPlayer,
    }),
    [handle, registerPlayer, unregisterPlayer]
  );

  return (
    <RadioPlayerContext.Provider value={value}>{children}</RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer(): RadioPlayerContextValue {
  const context = useContext(RadioPlayerContext);

  if (!context) {
    throw new Error('useRadioPlayer must be used within RadioPlayerProvider');
  }

  return context;
}
