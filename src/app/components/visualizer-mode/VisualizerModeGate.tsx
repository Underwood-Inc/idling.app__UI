'use client';

import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import dynamic from 'next/dynamic';

const VisualizerModeOverlay = dynamic(
  () => import('./VisualizerModeOverlay').then((module) => module.VisualizerModeOverlay),
  { ssr: false }
);

/** View gate — lazy-loads fullscreen visualizer bundles only when mode is active. */
export function VisualizerModeGate() {
  const { isActive } = useVisualizerMode();

  if (!isActive) {
    return null;
  }

  return <VisualizerModeOverlay />;
}
