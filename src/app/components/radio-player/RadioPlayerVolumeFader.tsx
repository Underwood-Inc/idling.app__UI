'use client';

import { useCallback, useEffect, useRef } from 'react';
import styles from './RadioPlayerVolumeFader.module.css';

export interface RadioPlayerVolumeFaderProps {
  volume: number;
  onChange: (level: number) => void;
}

interface VolumeRange {
  min: number;
  max: number;
  step: number;
}

const VOLUME_RANGE: VolumeRange = {
  min: 0,
  max: 1,
  step: 0.01,
};

const VOLUME_WHEEL_STEP = 0.05;

function clampVolume(value: number, range: VolumeRange): number {
  const stepped = Math.round(value / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, stepped));
}

function volumeToRatio(volume: number, range: VolumeRange): number {
  return (volume - range.min) / (range.max - range.min);
}

function ratioToVolume(ratio: number, range: VolumeRange): number {
  return clampVolume(range.min + ratio * (range.max - range.min), range);
}

export function RadioPlayerVolumeFader({ volume, onChange }: RadioPlayerVolumeFaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const range = VOLUME_RANGE;
  const ratio = volumeToRatio(volume, range);
  const levelPercent = ratio * 100;
  const fillTone = volume === 0 ? 'muted' : 'active';
  const pct = Math.round(volume * 100);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }

      const rect = track.getBoundingClientRect();
      const boundedX = Math.min(rect.right, Math.max(rect.left, clientX));
      const nextRatio = (boundedX - rect.left) / rect.width;
      onChange(ratioToVolume(nextRatio, range));
    },
    [onChange, range]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    updateFromPointer(event.clientX);
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
      const step = event.shiftKey ? 0.01 : VOLUME_WHEEL_STEP;
      const direction = event.deltaY < 0 ? 1 : -1;
      onChange(clampVolume(volume + step * direction, range));
    };

    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      track.removeEventListener('wheel', handleWheel);
    };
  }, [onChange, range, volume]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChange(clampVolume(volume + VOLUME_WHEEL_STEP, range));
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      onChange(clampVolume(volume - VOLUME_WHEEL_STEP, range));
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      onChange(range.max);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      onChange(range.min);
    }
  };

  return (
    <div className={styles.fader} data-volume-fader="">
      <div
        ref={trackRef}
        className={styles.fader__track}
        data-volume-track=""
        data-fill-tone={fillTone}
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct} percent`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.fader__well}>
          <div
            className={styles.fader__unfilled}
            style={{ width: `${Math.max(0, 100 - levelPercent)}%` }}
            aria-hidden="true"
          />
          <div
            className={styles.fader__fill}
            style={{ width: `${levelPercent}%` }}
            aria-hidden="true"
          />
          <div
            className={styles.fader__thumb}
            style={{
              left: `${levelPercent}%`,
              transform: 'translateX(-50%)',
            }}
            aria-hidden="true"
          >
            <span className={styles.fader__thumbGrip} />
          </div>
        </div>
      </div>
    </div>
  );
}
