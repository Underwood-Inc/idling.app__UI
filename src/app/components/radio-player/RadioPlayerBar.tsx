'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import type { RadioPlayerHandle } from '@widgets/radio-player/radioPlayer.types';
import type {
  BarVisualizerDensity,
  BarVisualizerPreferences,
} from '@widgets/radio-player/barVisualizer.types';
import { BAR_VISUALIZER_PRESET_DEFINITIONS } from '@widgets/radio-player/barVisualizerPresets';
import {
  RADIO_VISUALIZER_PRESETS,
} from '../visualizer-mode/radioVisualizerPresets';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './RadioPlayerBar.module.css';

export interface RadioPlayerBarPlaybackState {
  isPlaying: boolean;
  stationName: string;
  trackDisplay: string | null;
  volume: number;
  visualizerPrefs: BarVisualizerPreferences;
}

export type RadioPlayerPanel = 'stations' | 'look' | null;

export interface RadioPlayerBarProps {
  handle?: RadioPlayerHandle | null;
}

export interface RadioPlayerVolumeStepperProps {
  volume: number;
  onChange: (level: number) => void;
}

const DENSITY_OPTIONS: BarVisualizerDensity[] = ['compact', 'normal', 'wide'];

const DENSITY_LABELS: Record<BarVisualizerDensity, string> = {
  compact: 'Compact',
  normal: 'Normal',
  wide: 'Wide',
};

const VOLUME_STEP = 0.05;

function clampVolume(level: number): number {
  return Math.min(1, Math.max(0, level));
}

export function RadioPlayerVolumeStepper({ volume, onChange }: RadioPlayerVolumeStepperProps) {
  const clusterRef = useRef<HTMLDivElement>(null);
  const pct = Math.round(volume * 100);
  const isMuted = volume === 0;

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const step = event.shiftKey ? 0.01 : VOLUME_STEP;
      const direction = event.deltaY < 0 ? 1 : -1;
      onChange(clampVolume(volume + step * direction));
    },
    [onChange, volume]
  );

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) {
      return undefined;
    }

    cluster.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      cluster.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return (
    <div
      ref={clusterRef}
      className={styles.volume}
      tabIndex={0}
      aria-label={`Volume ${pct} percent. Scroll to adjust.`}
    >
      <button
        type="button"
        className={styles.volume__step}
        aria-label="Volume down"
        disabled={volume <= 0}
        onClick={() => {
          onChange(clampVolume(volume - VOLUME_STEP));
        }}
      >
        <SiteIcon id="arrowDown" sizeRem={0.85} />
      </button>
      <button
        type="button"
        className={styles.volume__step}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        onClick={() => {
          onChange(isMuted ? 0.85 : 0);
        }}
      >
        <SiteIcon id={isMuted ? 'ban' : 'megaphone'} sizeRem={0.9} />
      </button>
      <span className={styles.volume__pct} aria-hidden="true">
        {pct}
      </span>
      <button
        type="button"
        className={styles.volume__step}
        aria-label="Volume up"
        disabled={volume >= 1}
        onClick={() => {
          onChange(clampVolume(volume + VOLUME_STEP));
        }}
      >
        <SiteIcon id="arrowUp" sizeRem={0.85} />
      </button>
    </div>
  );
}

export function RadioPlayerBar({ handle: handleProp }: RadioPlayerBarProps) {
  const { handle: contextHandle } = useRadioPlayer();
  const {
    isActive,
    enterVisualizerMode,
    exitVisualizerMode,
    setSpectrumPresetIndex,
    spectrumPresetIndex,
  } = useVisualizerMode();
  const handle = handleProp ?? contextHandle;
  const playerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [playback, setPlayback] = useState<RadioPlayerBarPlaybackState | null>(null);
  const [activePanel, setActivePanel] = useState<RadioPlayerPanel>(null);

  useEffect(() => {
    if (!handle) {
      setPlayback(null);
      return undefined;
    }

    const sync = () => {
      setPlayback({
        isPlaying: handle.isPlaying(),
        stationName: handle.getStation(),
        trackDisplay: handle.getNowPlaying().display,
        volume: handle.getVolume(),
        visualizerPrefs: handle.getVisualizerPreferences(),
      });
    };

    sync();
    const timer = window.setInterval(sync, 400);
    return () => {
      window.clearInterval(timer);
    };
  }, [handle]);

  useEffect(() => {
    if (!handle) {
      return undefined;
    }

    const host = canvasHostRef.current;
    if (!host) {
      return undefined;
    }

    handle.mountBarCanvas(host);
  }, [handle]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return undefined;
    }

    const syncHeight = () => {
      const heightPx = Math.ceil(player.getBoundingClientRect().height + 36);
      document.documentElement.style.setProperty('--irp-bar-height', `${heightPx}px`);
      document.documentElement.style.setProperty('--irp-dock-height', `${heightPx}px`);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(player);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--irp-bar-height');
      document.documentElement.style.removeProperty('--irp-dock-height');
    };
  }, []);

  useEffect(() => {
    if (!activePanel) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePanel(null);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activePanel]);

  if (!handle || !playback) {
    return null;
  }

  const stationNames = handle.getStationNames();
  const trackText =
    playback.trackDisplay ?? (playback.isPlaying ? 'Listening…' : 'Press play to start');

  const togglePanel = (panel: RadioPlayerPanel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  return (
    <div
      ref={playerRef}
      className={styles.player}
      data-expanded={activePanel !== null}
      role="region"
      aria-label="Radio player"
      data-testid="radio-player-bar"
    >
      {activePanel === 'stations' ? (
        <section className={styles.panel} aria-label="Choose a station">
          <h2 className={styles.panel__heading}>Stations</h2>
          <div className={styles.chips} role="group">
            {stationNames.map((name) => (
              <button
                key={name}
                type="button"
                className={styles.chip}
                aria-pressed={name === playback.stationName}
                onClick={() => {
                  handle.setStation(name);
                  setActivePanel(null);
                  setPlayback((current) =>
                    current ? { ...current, stationName: name } : current
                  );
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activePanel === 'look' ? (
        <section className={styles.panel} aria-label="Bar visualizer look">
          <h2 className={styles.panel__heading}>Bar style</h2>
          <div className={styles.chips} role="group" aria-label="Visualizer styles">
            {BAR_VISUALIZER_PRESET_DEFINITIONS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={styles.chip}
                aria-pressed={preset.id === playback.visualizerPrefs.presetId}
                title={preset.description}
                onClick={() => {
                  handle.setVisualizerPreferences({ presetId: preset.id });
                  setPlayback((current) =>
                    current
                      ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                      : current
                  );
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <h2 className={styles.panel__heading}>Bar spacing</h2>
          <div className={styles.segments} role="group" aria-label="Bar spacing">
            {DENSITY_OPTIONS.map((density) => (
              <button
                key={density}
                type="button"
                className={styles.segment}
                aria-pressed={density === playback.visualizerPrefs.density}
                onClick={() => {
                  handle.setVisualizerPreferences({ density });
                  setPlayback((current) =>
                    current
                      ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                      : current
                  );
                }}
              >
                {DENSITY_LABELS[density]}
              </button>
            ))}
          </div>
          {isActive ? (
            <>
              <h2 className={styles.panel__heading}>Fullscreen spectrum</h2>
              <div className={styles.chips} role="group" aria-label="Fullscreen spectrum styles">
                {RADIO_VISUALIZER_PRESETS.map((preset, index) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={styles.chip}
                    aria-pressed={index === spectrumPresetIndex}
                    onClick={() => {
                      setSpectrumPresetIndex(index);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      <div className={styles.row}>
        <button
          type="button"
          className={styles.play}
          data-playing={playback.isPlaying}
          aria-label={playback.isPlaying ? 'Pause' : 'Play'}
          onClick={() => {
            void (async () => {
              if (handle.isPlaying()) {
                handle.pause();
              } else {
                await handle.play();
              }
              setPlayback((current) =>
                current ? { ...current, isPlaying: handle.isPlaying() } : current
              );
            })();
          }}
        >
          <SiteIcon id={playback.isPlaying ? 'pause' : 'radio'} sizeRem={1} />
        </button>

        <div ref={canvasHostRef} className={styles.viz} aria-hidden="true" />

        <div className={styles.meta}>
          <p className={styles.station}>{playback.stationName}</p>
          <p className={styles.track}>{trackText}</p>
        </div>

        <div className={styles.tools}>
          <RadioPlayerVolumeStepper
            volume={playback.volume}
            onChange={(level) => {
              handle.setVolume(level);
              setPlayback((current) => (current ? { ...current, volume: level } : current));
            }}
          />

          <span className={styles.divider} aria-hidden="true" />

          <button
            type="button"
            className={styles.iconBtn}
            aria-pressed={activePanel === 'stations'}
            aria-label="Choose station"
            title="Stations"
            onClick={() => {
              togglePanel('stations');
            }}
          >
            <SiteIcon id="library" sizeRem={1} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-pressed={activePanel === 'look'}
            aria-label="Bar and spectrum look"
            title="Look"
            onClick={() => {
              togglePanel('look');
            }}
          >
            <SiteIcon id="palette" sizeRem={1} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-pressed={isActive}
            aria-label={
              isActive ? 'Exit fullscreen visualizer' : 'Open fullscreen visualizer'
            }
            title={isActive ? 'Exit visualizer' : 'Fullscreen visualizer'}
            data-testid="visualizer-mode-trigger"
            onClick={() => {
              if (isActive) {
                void exitVisualizerMode();
                return;
              }
              void enterVisualizerMode();
            }}
          >
            <SiteIcon id={isActive ? 'close' : 'maximize'} sizeRem={1} />
          </button>
        </div>
      </div>
    </div>
  );
}
