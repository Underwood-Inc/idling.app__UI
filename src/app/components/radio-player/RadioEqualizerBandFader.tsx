'use client';

import { RADIO_EQUALIZER_GAIN_RANGE } from '@widgets/radio-player/radioEqualizerPresets';
import { useCallback, useEffect, useRef } from 'react';
import styles from './RadioEqualizerBandFader.module.css';

export interface RadioEqualizerBandFaderProps {
  bandIndex: number;
  label: string;
  gain: number;
  onChange: (bandIndex: number, gain: number) => void;
}

interface GainRange {
  min: number;
  max: number;
  step: number;
}

function clampGain(value: number, range: GainRange): number {
  const stepped = Math.round(value / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, stepped));
}

function gainToRatio(gain: number, range: GainRange): number {
  return (gain - range.min) / (range.max - range.min);
}

function ratioToGain(ratio: number, range: GainRange): number {
  return clampGain(range.min + ratio * (range.max - range.min), range);
}

export function RadioEqualizerBandFader({
  bandIndex,
  label,
  gain,
  onChange,
}: RadioEqualizerBandFaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const range: GainRange = {
    min: RADIO_EQUALIZER_GAIN_RANGE.min,
    max: RADIO_EQUALIZER_GAIN_RANGE.max,
    step: RADIO_EQUALIZER_GAIN_RANGE.step,
  };

  const ratio = gainToRatio(gain, range);
  const levelPercent = ratio * 100;
  const fillTone = levelPercent > 50.5 ? 'boost' : levelPercent < 49.5 ? 'cut' : 'flat';

  const updateFromPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }

      const rect = track.getBoundingClientRect();
      const boundedY = Math.min(rect.bottom, Math.max(rect.top, clientY));
      const nextRatio = 1 - (boundedY - rect.top) / rect.height;
      onChange(bandIndex, ratioToGain(nextRatio, range));
    },
    [bandIndex, onChange, range]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    updateFromPointer(event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return undefined;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const step = event.shiftKey ? range.step * 0.5 : range.step;
      const direction = event.deltaY < 0 ? 1 : -1;
      onChange(bandIndex, clampGain(gain + step * direction, range));
    };

    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      track.removeEventListener('wheel', handleWheel);
    };
  }, [bandIndex, gain, onChange, range]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      event.preventDefault();
      onChange(bandIndex, clampGain(gain + range.step, range));
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      event.preventDefault();
      onChange(bandIndex, clampGain(gain - range.step, range));
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      onChange(bandIndex, range.max);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      onChange(bandIndex, range.min);
    }
  };

  return (
    <div className={styles.fader}>
      <div
        ref={trackRef}
        className={styles.fader__track}
        data-fill-tone={fillTone}
        role="slider"
        tabIndex={0}
        aria-label={`${label} hertz band`}
        aria-valuemin={range.min}
        aria-valuemax={range.max}
        aria-valuenow={gain}
        aria-valuetext={`${gain} decibels`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.fader__well}>
          <div
            className={styles.fader__unfilled}
            style={{ height: `${Math.max(0, 100 - levelPercent)}%` }}
            aria-hidden="true"
          />
          <div
            className={styles.fader__fill}
            style={{ height: `${levelPercent}%` }}
            aria-hidden="true"
          />
          <div className={styles.fader__zero} aria-hidden="true" />
          <div
            className={styles.fader__thumb}
            style={{
              bottom: `${levelPercent}%`,
              transform: 'translateY(50%)',
            }}
            aria-hidden="true"
          >
            <span className={styles.fader__thumbGrip} />
          </div>
        </div>
      </div>
      <span className={styles.fader__label}>{label}</span>
      <span className={styles.fader__gain}>{gain > 0 ? `+${gain}` : gain}</span>
    </div>
  );
}
