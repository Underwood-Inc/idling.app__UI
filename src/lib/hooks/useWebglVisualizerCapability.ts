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

export function useWebglVisualizerCapability(): WebglVisualizerCapabilityState {
  const [capability, setCapability] = useState<WebglVisualizerCapabilityState>(
    DEFAULT_CAPABILITY_STATE
  );

  useEffect(() => {
    const detected = detectWebglVisualizerCapability();
    setCapability({
      isResolved: true,
      isSupported: detected.isSupported,
      reason: detected.reason,
    });
  }, []);

  return capability;
}
