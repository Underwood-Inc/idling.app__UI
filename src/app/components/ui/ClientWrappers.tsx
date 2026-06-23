'use client';

import { AmbientBackground } from '../ambient-background/AmbientBackground';
import { OverlayRenderer } from './OverlayRenderer';

/**
 * Client-side wrapper components for use in server components
 */
export function AmbientBackgroundWrapper() {
  return <AmbientBackground />;
}

export function OverlayRendererWrapper() {
  return <OverlayRenderer />;
}
