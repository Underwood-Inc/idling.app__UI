import { useEffect, useState } from 'react';
import { detectWebglVisualizerCapability } from '@widgets/radio-player/webgl/detectWebglVisualizerCapability';
import type { WebglVisualizerCapability } from '@widgets/radio-player/webgl/webglVisualizer.types';

export interface WebglVisualizerCapabilityState extends WebglVisualizerCapability {
  isResolved: boolean;
}

const DEFAULT_CAPABILITY_STATE: WebglVisualizerCapabilityState = {
  isResolved: false,
  isSupported: false,
  reason: null,
};

function readWebglVisualizerCapability(): WebglVisualizerCapabilityState {
  const detected = detectWebglVisualizerCapability();
  return {
    isResolved: true,
    isSupported: detected.isSupported,
    reason: detected.reason,
  };
}

function readInitialWebglVisualizerCapability(): WebglVisualizerCapabilityState {
  if (typeof window === 'undefined') {
    return DEFAULT_CAPABILITY_STATE;
  }

  return readWebglVisualizerCapability();
}

export function useWebglVisualizerCapability(): WebglVisualizerCapabilityState {
  const [capability, setCapability] = useState<WebglVisualizerCapabilityState>(
    readInitialWebglVisualizerCapability
  );

  useEffect(() => {
    setCapability(readWebglVisualizerCapability());

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      setCapability(readWebglVisualizerCapability());
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return capability;
}
