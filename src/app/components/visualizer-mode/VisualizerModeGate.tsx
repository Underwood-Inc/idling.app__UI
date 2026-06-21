'use client';

import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { VisualizerModeOverlay } from './VisualizerModeOverlay';

/** View gate — renders fullscreen spectrum overlay when mode is active. */
export function VisualizerModeGate() {
  const { isActive } = useVisualizerMode();

  if (!isActive) {
    return null;
  }

  return <VisualizerModeOverlay />;
}
