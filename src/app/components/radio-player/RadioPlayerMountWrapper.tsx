'use client';

import { RadioAudioEnergyBridge } from './RadioAudioEnergyBridge';
import { RadioPlayerMount } from './RadioPlayerMount';

export function RadioPlayerMountWrapper() {
  return (
    <>
      <RadioPlayerMount autoplay={false} />
      <RadioAudioEnergyBridge />
    </>
  );
}
