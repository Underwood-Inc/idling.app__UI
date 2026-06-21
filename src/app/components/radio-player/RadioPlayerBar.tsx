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
import { RADIO_STATION_DEFINITIONS } from '@widgets/radio-player/radioStationCatalog';
import type { RadioStationGenreId } from '@widgets/radio-player/radioPlayer.types';
import {
  findRadioStationDefinition,
  filterRadioStationsByGenre,
  getRadioStationGenre,
  listAvailableRadioStations,
  listRadioStationGenreFilters,
} from '@widgets/radio-player/radioStationBrowse';
import { RADIO_VISUALIZER_PRESETS } from '@widgets/radio-player/radioVisualizerPresets';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './RadioPlayerBar.module.css';

export interface RadioPlayerBarPlaybackState {
  isPlaying: boolean;
  stationName: string;
  trackDisplay: string | null;
  volume: number;
  visualizerPrefs: BarVisualizerPreferences;
}

export type RadioPlayerPanel = 'stations' | 'look' | 'spectrum' | null;

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

function isUsableTrackDisplay(display: string | null): display is string {
  if (!display) {
    return false;
  }

  const normalized = display.trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'listening...' && normalized !== 'listening…';
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
      data-volume={pct}
      aria-label={`Volume ${pct} percent. Scroll to adjust.`}
    >
      <button
        type="button"
        className={`${styles.volume__mute} no-glass`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        title={isMuted ? 'Unmute' : 'Mute'}
        onClick={() => {
          onChange(isMuted ? 0.85 : 0);
        }}
      >
        <SiteIcon id={isMuted ? 'ban' : 'megaphone'} sizeRem={0.9} title="" />
      </button>
      <input
        type="range"
        className={styles.volume__slider}
        min={0}
        max={1}
        step={0.01}
        value={volume}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct} percent`}
        onChange={(event) => {
          onChange(clampVolume(Number(event.target.value)));
        }}
      />
      <span className={styles.volume__pct} aria-hidden="true">
        {pct}
      </span>
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
  const [stationGenreFilter, setStationGenreFilter] = useState<RadioStationGenreId | null>(null);

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

  const stationNames = handle?.getStationNames() ?? [];

  const availableStations = useMemo(
    () => listAvailableRadioStations(RADIO_STATION_DEFINITIONS, stationNames),
    [stationNames]
  );

  const stationGenreFilters = useMemo(
    () => listRadioStationGenreFilters(RADIO_STATION_DEFINITIONS, stationNames),
    [stationNames]
  );

  const filteredStations = useMemo(
    () => filterRadioStationsByGenre(availableStations, stationGenreFilter),
    [availableStations, stationGenreFilter]
  );

  if (!handle || !playback) {
    return null;
  }

  const activeStation = findRadioStationDefinition(
    RADIO_STATION_DEFINITIONS,
    playback.stationName
  );
  const activeSpectrumPreset =
    RADIO_VISUALIZER_PRESETS[spectrumPresetIndex] ?? RADIO_VISUALIZER_PRESETS[0];

  const subtitle = (() => {
    if (!playback.isPlaying) {
      return 'Press play to start';
    }

    if (isUsableTrackDisplay(playback.trackDisplay)) {
      return playback.trackDisplay;
    }

    if (activeStation) {
      return `${getRadioStationGenre(activeStation.genre).label} · ${activeStation.blurb}`;
    }

    return null;
  })();

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
        <section className={`${styles.panel} ${styles.panelStations}`} aria-label="Choose a station">
          <div className={styles.genreFilters} role="toolbar" aria-label="Filter by genre">
            <button
              type="button"
              className={`${styles.genreFilter} no-glass`}
              aria-pressed={stationGenreFilter === null}
              onClick={() => {
                setStationGenreFilter(null);
              }}
            >
              All
            </button>
            {stationGenreFilters.map(({ genre }) => (
              <button
                key={genre.id}
                type="button"
                className={`${styles.genreFilter} no-glass`}
                aria-pressed={stationGenreFilter === genre.id}
                onClick={() => {
                  setStationGenreFilter((current) => (current === genre.id ? null : genre.id));
                }}
              >
                {genre.label}
              </button>
            ))}
          </div>
          <div className={styles.stationList} role="group" aria-label="Stations">
            {filteredStations.map((station) => (
              <button
                key={station.name}
                type="button"
                className={`${styles.stationRow} no-glass`}
                aria-pressed={station.name === playback.stationName}
                onClick={() => {
                  handle.setStation(station.name);
                  setActivePanel(null);
                  setStationGenreFilter(null);
                  setPlayback((current) =>
                    current ? { ...current, stationName: station.name } : current
                  );
                }}
              >
                <span className={styles.stationRow__flag} aria-hidden="true">
                  {station.regionFlag}
                </span>
                <span className={styles.stationRow__body}>
                  <span className={styles.stationRow__name}>{station.name}</span>
                  <span className={styles.stationRow__blurb}>{station.blurb}</span>
                </span>
                <span className={styles.stationRow__genre}>
                  {getRadioStationGenre(station.genre).label}
                </span>
                {station.name === playback.stationName ? (
                  <SiteIcon
                    id="check"
                    className={styles.stationRow__check}
                    sizeRem={0.95}
                    title=""
                  />
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activePanel === 'look' ? (
        <section className={styles.panel} aria-label="Bar visualizer look">
          <div className={styles.panelSection}>
            <h2 className={styles.panelSection__title}>Bar style</h2>
            <div className={styles.optionList} role="group" aria-label="Bar visualizer styles">
              {BAR_VISUALIZER_PRESET_DEFINITIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`${styles.optionRow} no-glass`}
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
          </div>
          <div className={styles.panelSection}>
            <h2 className={styles.panelSection__title}>Bar spacing</h2>
            <div className={styles.segments} role="group" aria-label="Bar spacing">
              {DENSITY_OPTIONS.map((density) => (
                <button
                  key={density}
                  type="button"
                  className={`${styles.segment} no-glass`}
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
          </div>
        </section>
      ) : null}

      {activePanel === 'spectrum' && isActive ? (
        <section className={styles.panel} aria-label="Fullscreen spectrum style">
          <div className={styles.panelSection}>
            <h2 className={styles.panelSection__title}>Fullscreen spectrum</h2>
            <div className={styles.optionList} role="group" aria-label="Fullscreen spectrum styles">
              {RADIO_VISUALIZER_PRESETS.map((preset, index) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`${styles.optionRow} no-glass`}
                  aria-pressed={index === spectrumPresetIndex}
                  onClick={() => {
                    setSpectrumPresetIndex(index);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className={styles.row}>
        <div className={styles.lead}>
          <button
            type="button"
            className={`${styles.play} no-glass`}
            data-playing={playback.isPlaying ? 'true' : 'false'}
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
            <SiteIcon
              id={playback.isPlaying ? 'pause' : 'play'}
              className={playback.isPlaying ? undefined : styles.play__icon}
              sizeRem={1}
              title=""
            />
          </button>

          <div ref={canvasHostRef} className={styles.viz} aria-hidden="true" />

          <div className={styles.meta}>
            <button
              type="button"
              className={`${styles.stationPicker} no-glass`}
              aria-expanded={activePanel === 'stations'}
              aria-label={`Change station — now on ${playback.stationName}`}
              title="Change station"
              onClick={() => {
                togglePanel('stations');
              }}
            >
              {activeStation ? (
                <span className={styles.station__flag} aria-hidden="true">
                  {activeStation.regionFlag}
                </span>
              ) : null}
              <span className={styles.station__name}>{playback.stationName}</span>
            </button>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
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
            className={`${styles.textBtn} no-glass`}
            aria-pressed={activePanel === 'look'}
            aria-label="Bar visualizer look"
            onClick={() => {
              togglePanel('look');
            }}
          >
            <SiteIcon id="palette" sizeRem={0.9} title="" />
            <span className={styles.textBtn__label}>Look</span>
          </button>
          {isActive ? (
            <button
              type="button"
              className={`${styles.textBtn} ${styles.textBtnSpectrum} no-glass`}
              aria-pressed={activePanel === 'spectrum'}
              aria-label={`Fullscreen spectrum style: ${activeSpectrumPreset.label}`}
              onClick={() => {
                togglePanel('spectrum');
              }}
            >
              <span className={styles.textBtn__label}>Spectrum</span>
              <span className={styles.textBtn__value}>{activeSpectrumPreset.label}</span>
            </button>
          ) : null}
          <button
            type="button"
            className={`${styles.textBtn} ${isActive ? styles.textBtnExit : ''} no-glass`}
            aria-pressed={isActive}
            aria-label={
              isActive ? 'Exit fullscreen visualizer' : 'Open fullscreen visualizer'
            }
            data-testid="visualizer-mode-trigger"
            onClick={() => {
              if (isActive) {
                setActivePanel(null);
                void exitVisualizerMode();
                return;
              }
              void enterVisualizerMode();
            }}
          >
            <SiteIcon id={isActive ? 'close' : 'maximize'} sizeRem={0.9} title="" />
            <span className={styles.textBtn__label}>{isActive ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
