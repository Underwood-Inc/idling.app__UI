'use client';

import { AmbientBackground } from '../ambient-background/AmbientBackground';
import { RadioAudioEnergyBridge } from '../radio-player/RadioAudioEnergyBridge';
import { RadioPlayerMount } from '../radio-player/RadioPlayerMount';
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

export function RadioPlayerMountWrapper() {
  return (
    <>
      <RadioPlayerMount autoplay={false} />
      <RadioAudioEnergyBridge />
    </>
  );
}
