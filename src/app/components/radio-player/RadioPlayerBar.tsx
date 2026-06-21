'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { useRadioDockLayoutMetrics } from '@lib/hooks/useRadioDockLayoutMetrics';
import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import type { RadioPlayerHandle } from '@widgets/radio-player/radioPlayer.types';
import type {
  BarVisualizerDensity,
  BarVisualizerPreferences,
} from '@widgets/radio-player/barVisualizer.types';
import { BAR_VISUALIZER_PRESET_DEFINITIONS, getBarVisualizerDockLayout } from '@widgets/radio-player/barVisualizerPresets';
import type { RadioStationGenreId } from '@widgets/radio-player/radioPlayer.types';
import {
  CUSTOM_AUDIO_SOURCES_UI_ENABLED,
  isCustomAudioSourceDefinition,
} from '@widgets/radio-player/customAudioSourceBrowse';
import {
  findRadioStationDefinition,
  filterRadioStationsByGenre,
  getRadioStationGenre,
  listAvailableRadioStations,
  listRadioStationGenreFilters,
  listRadioStationGenres,
} from '@widgets/radio-player/radioStationBrowse';
import { RADIO_VISUALIZER_PRESETS } from '@widgets/radio-player/radioVisualizerPresets';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { RadioPlayerCustomSourceForm } from './RadioPlayerCustomSourceForm';
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
  const {
    handle: contextHandle,
    stationDefinitions,
    removeCustomSource,
    updateCustomSourceGenre,
  } = useRadioPlayer();
  const {
    isActive,
    enterVisualizerMode,
    exitVisualizerMode,
    setSpectrumPresetIndex,
    spectrumPresetIndex,
    spectrumEnabled,
    setSpectrumEnabled,
    spectrumOpacity,
    setSpectrumOpacity,
    spectrumBarHeight,
    setSpectrumBarHeight,
  } = useVisualizerMode();
  const handle = handleProp ?? contextHandle;
  const playerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [playback, setPlayback] = useState<RadioPlayerBarPlaybackState | null>(null);
  const [activePanel, setActivePanel] = useState<RadioPlayerPanel>(null);
  const [stationGenreFilter, setStationGenreFilter] = useState<RadioStationGenreId | null>(null);
  const [showCustomSourceForm, setShowCustomSourceForm] = useState(false);
  const customSourcePanelRef = useRef<HTMLDivElement>(null);

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

  const playbackReady = playback !== null;
  const visualizerPresetId = playback?.visualizerPrefs.presetId;
  const visualizerDensity = playback?.visualizerPrefs.density;
  const vizDockLayout = getBarVisualizerDockLayout(visualizerPresetId ?? 'wave');

  useLayoutEffect(() => {
    if (!handle || !playbackReady || isActive) {
      return undefined;
    }

    const host = canvasHostRef.current;
    if (!host) {
      return undefined;
    }

    handle.mountBarCanvas(host);

    const onResize = () => {
      handle.resizeBarCanvas();
    };

    onResize();
    const observer = new ResizeObserver(onResize);
    observer.observe(host);
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [handle, isActive, playbackReady]);

  useLayoutEffect(() => {
    if (!handle || !playbackReady || isActive) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      handle.resizeBarCanvas();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [handle, isActive, playbackReady, visualizerPresetId, visualizerDensity, vizDockLayout]);

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

  useRadioDockLayoutMetrics({
    playerRef,
    expanded: activePanel !== null,
  });

  useEffect(() => {
    if (!showCustomSourceForm) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      customSourcePanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [showCustomSourceForm]);

  const stationNames = handle?.getStationNames() ?? [];

  const availableStations = useMemo(
    () => listAvailableRadioStations(stationDefinitions, stationNames),
    [stationDefinitions, stationNames]
  );

  const stationGenreFilters = useMemo(
    () => listRadioStationGenreFilters(stationDefinitions, stationNames),
    [stationDefinitions, stationNames]
  );

  const filteredStations = useMemo(
    () => filterRadioStationsByGenre(availableStations, stationGenreFilter),
    [availableStations, stationGenreFilter]
  );
  const genreOptions = listRadioStationGenres();

  if (!handle || !playback) {
    return null;
  }

  const activeStation = findRadioStationDefinition(stationDefinitions, playback.stationName);
  const activeSpectrumPreset =
    RADIO_VISUALIZER_PRESETS[spectrumPresetIndex] ?? RADIO_VISUALIZER_PRESETS[0];
  const activeBarPreset =
    BAR_VISUALIZER_PRESET_DEFINITIONS.find(
      (preset) => preset.id === playback.visualizerPrefs.presetId
    ) ?? BAR_VISUALIZER_PRESET_DEFINITIONS[0];
  const activeLookLabel = isActive
    ? spectrumEnabled
      ? activeSpectrumPreset.label
      : 'None'
    : activeBarPreset.label;
  const spectrumOpacityPct = Math.round(spectrumOpacity * 100);
  const spectrumBarHeightPct = Math.round(spectrumBarHeight * 100);

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
      data-visualizer-mode={isActive ? 'true' : 'false'}
      role="region"
      aria-label="Radio player"
      data-testid="radio-player-bar"
    >
      {activePanel === 'stations' ? (
        <section
          className={`${styles.panel} ${styles.panelStations}`}
          data-custom-source-form={showCustomSourceForm ? 'true' : 'false'}
          aria-label="Choose a station"
        >
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
            {filteredStations.map((station) => {
              const isCustom = isCustomAudioSourceDefinition(station);
              const isActiveStation = station.name === playback.stationName;

              return (
                <div
                  key={station.name}
                  className={styles.stationRow}
                  data-active={isActiveStation ? 'true' : 'false'}
                >
                  <button
                    type="button"
                    className={`${styles.stationRow__select} no-glass`}
                    aria-pressed={isActiveStation}
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
                    {isActiveStation ? (
                      <SiteIcon
                        id="check"
                        className={styles.stationRow__check}
                        sizeRem={0.95}
                        title=""
                      />
                    ) : (
                      <span className={styles.stationRow__checkSpacer} aria-hidden="true" />
                    )}
                  </button>
                  {isCustom ? (
                    <select
                      className={styles.stationRow__genreSelect}
                      value={station.genre}
                      aria-label={`Genre for ${station.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                      onChange={(event) => {
                        void updateCustomSourceGenre(
                          station.customId,
                          event.target.value as RadioStationGenreId
                        );
                      }}
                    >
                      {genreOptions.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={styles.stationRow__genre}>
                      {getRadioStationGenre(station.genre).label}
                    </span>
                  )}
                  {isCustom ? (
                    <button
                      type="button"
                      className={`${styles.stationRow__remove} no-glass`}
                      aria-label={`Remove ${station.name}`}
                      title={`Remove ${station.name}`}
                      onClick={() => {
                        void removeCustomSource(station.customId);
                      }}
                    >
                      <SiteIcon id="trash" sizeRem={0.85} title="" />
                    </button>
                  ) : (
                    <span className={styles.stationRow__removeSpacer} aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
          <div ref={customSourcePanelRef} className={styles.customSourcePanel}>
            <button
              type="button"
              className={`${styles.customSourceToggle} no-glass`}
              aria-expanded={showCustomSourceForm}
              disabled={!CUSTOM_AUDIO_SOURCES_UI_ENABLED}
              title={
                CUSTOM_AUDIO_SOURCES_UI_ENABLED
                  ? undefined
                  : 'Custom sources are not available yet'
              }
              onClick={() => {
                setShowCustomSourceForm((current) => !current);
              }}
            >
              {showCustomSourceForm ? 'Hide add-source form' : 'Add your own source'}
            </button>
            {CUSTOM_AUDIO_SOURCES_UI_ENABLED && showCustomSourceForm ? (
              <RadioPlayerCustomSourceForm
                onAdded={(genre) => {
                  setShowCustomSourceForm(false);
                  setStationGenreFilter(genre);
                }}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {activePanel === 'look' ? (
        isActive ? (
          <section className={styles.panel} aria-label="Fullscreen spectrum style">
            <div className={styles.panelSection}>
              <h2 className={styles.panelSection__title}>Spectrum style</h2>
              <div className={styles.optionList} role="group" aria-label="Fullscreen spectrum styles">
                <button
                  type="button"
                  className={`${styles.optionRow} no-glass`}
                  aria-pressed={!spectrumEnabled}
                  onClick={() => {
                    setSpectrumEnabled(false);
                  }}
                >
                  None
                </button>
                {RADIO_VISUALIZER_PRESETS.map((preset, index) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.optionRow} no-glass`}
                    aria-pressed={spectrumEnabled && index === spectrumPresetIndex}
                    onClick={() => {
                      setSpectrumPresetIndex(index);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.panelSection}>
              <h2 className={styles.panelSection__title}>Spectrum opacity</h2>
              <div className={styles.opacityControl}>
                <input
                  type="range"
                  className={`${styles.opacityControl__slider} no-glass`}
                  min={0}
                  max={1}
                  step={0.05}
                  value={spectrumOpacity}
                  disabled={!spectrumEnabled}
                  aria-label="Fullscreen spectrum opacity"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={spectrumOpacityPct}
                  aria-valuetext={`${spectrumOpacityPct} percent`}
                  onChange={(event) => {
                    setSpectrumOpacity(Number(event.target.value));
                  }}
                />
                <span className={styles.opacityControl__pct} aria-hidden="true">
                  {spectrumOpacityPct}
                </span>
              </div>
            </div>
            <div className={styles.panelSection}>
              <h2 className={styles.panelSection__title}>Bar height</h2>
              <div className={styles.opacityControl}>
                <input
                  type="range"
                  className={`${styles.opacityControl__slider} no-glass`}
                  min={0.5}
                  max={2.5}
                  step={0.05}
                  value={spectrumBarHeight}
                  disabled={!spectrumEnabled}
                  aria-label="Fullscreen spectrum bar height"
                  aria-valuemin={50}
                  aria-valuemax={250}
                  aria-valuenow={spectrumBarHeightPct}
                  aria-valuetext={`${spectrumBarHeightPct} percent`}
                  onChange={(event) => {
                    setSpectrumBarHeight(Number(event.target.value));
                  }}
                />
                <span className={styles.opacityControl__pct} aria-hidden="true">
                  {spectrumBarHeightPct}
                </span>
              </div>
            </div>
          </section>
        ) : (
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
        )
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
          {!isActive ? (
            <div
              ref={canvasHostRef}
              className={styles.viz}
              data-layout={vizDockLayout}
              aria-hidden="true"
            />
          ) : null}
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
            aria-label={
              isActive
                ? spectrumEnabled
                  ? `Fullscreen spectrum style: ${activeSpectrumPreset.label}`
                  : 'Fullscreen spectrum disabled'
                : 'Bar visualizer look'
            }
            onClick={() => {
              togglePanel('look');
            }}
          >
            <SiteIcon id="palette" sizeRem={0.9} title="" />
            <span className={styles.textBtn__label}>Look</span>
            <span className={styles.textBtn__value}>{activeLookLabel}</span>
          </button>
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
