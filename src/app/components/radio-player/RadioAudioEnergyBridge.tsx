'use client';

import {
  applyRadioAudioEnergyToDocument,
  clearRadioAudioEnergyFromDocument,
  computeRadioAudioEnergy,
  EMPTY_RADIO_AUDIO_ENERGY,
  smoothRadioAudioEnergy,
  type RadioAudioEnergy,
} from '@lib/audio/computeRadioAudioEnergy';
import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { useEffect } from 'react';

const ATTACK = 0.28;
const RELEASE = 0.12;
const ENERGY_IDLE_THRESHOLD = 0.004;

function hasMeaningfulEnergy(energy: RadioAudioEnergy): boolean {
  return (
    energy.overall > ENERGY_IDLE_THRESHOLD ||
    energy.bass > ENERGY_IDLE_THRESHOLD ||
    energy.mid > ENERGY_IDLE_THRESHOLD ||
    energy.treble > ENERGY_IDLE_THRESHOLD
  );
}

export function RadioAudioEnergyBridge() {
  const { handle } = useRadioPlayer();

  useEffect(() => {
    if (!handle) {
      clearRadioAudioEnergyFromDocument();
      return undefined;
    }

    let rafId = 0;
    let loopActive = false;
    let smoothed: RadioAudioEnergy = { ...EMPTY_RADIO_AUDIO_ENERGY };
    let frequencyData = new Uint8Array(0);

    const stopLoop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      loopActive = false;
    };

    const tick = () => {
      if (document.visibilityState !== 'visible') {
        stopLoop();
        clearRadioAudioEnergyFromDocument();
        return;
      }

      const analyser = handle.getAnalyser();
      const isPlaying = handle.isPlaying();

      if (analyser && isPlaying) {
        if (frequencyData.length !== analyser.frequencyBinCount) {
          frequencyData = new Uint8Array(analyser.frequencyBinCount);
        }

        analyser.getByteFrequencyData(frequencyData);
        const target = computeRadioAudioEnergy({ frequencyData });

        smoothed = smoothRadioAudioEnergy({
          current: smoothed,
          target,
          attack: ATTACK,
          release: RELEASE,
        });
      } else {
        smoothed = smoothRadioAudioEnergy({
          current: smoothed,
          target: EMPTY_RADIO_AUDIO_ENERGY,
          attack: ATTACK,
          release: RELEASE,
        });
      }

      applyRadioAudioEnergyToDocument(smoothed);

      if (!isPlaying && !hasMeaningfulEnergy(smoothed)) {
        stopLoop();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (loopActive || document.visibilityState !== 'visible') {
        return;
      }

      loopActive = true;
      rafId = window.requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && handle.isPlaying()) {
        startLoop();
        return;
      }

      stopLoop();
      clearRadioAudioEnergyFromDocument();
    };

    const onPlay = () => {
      startLoop();
    };

    const onPause = () => {
      stopLoop();
      clearRadioAudioEnergyFromDocument();
    };

    const audio = handle.getAudioElement();
    document.addEventListener('visibilitychange', onVisibilityChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    if (handle.isPlaying() && document.visibilityState === 'visible') {
      startLoop();
    } else {
      clearRadioAudioEnergyFromDocument();
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      stopLoop();
      clearRadioAudioEnergyFromDocument();
    };
  }, [handle]);

  return null;
}
