'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { useRadioDockLayoutMetrics } from '@lib/hooks/useRadioDockLayoutMetrics';
import { useRadioMetaWidth } from '@lib/hooks/useRadioMetaWidth';
import { HumanFriendlySearchHighlight } from '@molecules/humanFriendlySearch/HumanFriendlySearchHighlight';
import { parseHumanFriendlySearchQuery } from '@molecules/humanFriendlySearch/parseHumanFriendlySearchQuery';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type {
  BarVisualizerDensity,
  BarVisualizerPreferences,
} from '@widgets/radio-player/barVisualizer.types';
import { BAR_VISUALIZER_PRESET_DEFINITIONS, getBarVisualizerDockLayout } from '@widgets/radio-player/barVisualizerPresets';
import {
  CUSTOM_AUDIO_SOURCES_UI_ENABLED,
  isCustomAudioSourceDefinition,
} from '@widgets/radio-player/customAudioSourceBrowse';
import {
  RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE,
  RADIO_FULLSCREEN_VISUAL_HEIGHT_RATIO_RANGE,
  resolveRadioFullscreenVisualHeightRatio,
} from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import type { RadioPlayerHandle, RadioStationGenreId } from '@widgets/radio-player/radioPlayer.types';
import {
  filterRadioStationsByGenre,
  filterRadioStationsBySearch,
  findRadioStationDefinition,
  getRadioStationGenre,
  isRadioStationInGenreFilter,
  listAvailableRadioStations,
  listRadioStationGenreFilters,
} from '@widgets/radio-player/radioStationBrowse';
import {
  loadRadioStationGenreFilter,
  saveRadioStationGenreFilter,
} from '@widgets/radio-player/radioStationGenreFilterPersistence';
import { RADIO_VISUALIZER_PRESETS } from '@widgets/radio-player/radioVisualizerPresets';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './RadioPlayerBar.module.css';
import { RadioPlayerCustomSourceForm } from './RadioPlayerCustomSourceForm';
import { RadioPlayerOverflowText } from './RadioPlayerOverflowText';

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
    fullscreenSource,
    setFullscreenSource,
  } = useVisualizerMode();
  const handle = handleProp ?? contextHandle;
  const playerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const metaBlockRef = useRef<HTMLDivElement>(null);
  const stationListRef = useRef<HTMLDivElement>(null);
  const prevActivePanelRef = useRef<RadioPlayerPanel>(null);
  const [playback, setPlayback] = useState<RadioPlayerBarPlaybackState | null>(null);
  const [activePanel, setActivePanel] = useState<RadioPlayerPanel>(null);
  const [stationGenreFilter, setStationGenreFilter] = useState<RadioStationGenreId | null>(() =>
    loadRadioStationGenreFilter()
  );
  const [stationSearchQuery, setStationSearchQuery] = useState('');
  const [showCustomSourceForm, setShowCustomSourceForm] = useState(false);
  const customSourcePanelRef = useRef<HTMLDivElement>(null);

  const applyStationGenreFilter = useCallback((genreId: RadioStationGenreId | null) => {
    setStationGenreFilter(genreId);
    saveRadioStationGenreFilter(genreId);
  }, []);

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
  const visualizerEnabled = playback?.visualizerPrefs.enabled ?? true;
  const vizDockLayout = getBarVisualizerDockLayout(visualizerPresetId ?? 'wave');
  const { metaWidthPx, isResizing: isMetaResizing, beginResize: beginMetaResize, resetWidth: resetMetaWidth } =
    useRadioMetaWidth({
      metaBlockRef,
      rowRef,
      isFullscreen: isActive,
    });

  useLayoutEffect(() => {
    if (!handle || !playbackReady || isActive || !visualizerEnabled) {
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
  }, [handle, isActive, playbackReady, visualizerEnabled]);

  useLayoutEffect(() => {
    if (!handle || !playbackReady || isActive || !visualizerEnabled) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      handle.resizeBarCanvas();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [handle, isActive, playbackReady, visualizerPresetId, visualizerDensity, vizDockLayout, visualizerEnabled]);

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

  useEffect(() => {
    if (activePanel === 'stations') {
      return undefined;
    }

    setStationSearchQuery('');
    return undefined;
  }, [activePanel]);

  useRadioDockLayoutMetrics({
    playerRef,
    rowRef,
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

  const parsedStationSearch = useMemo(
    () => parseHumanFriendlySearchQuery(stationSearchQuery),
    [stationSearchQuery]
  );

  const displayedStations = useMemo(
    () => filterRadioStationsBySearch(filteredStations, parsedStationSearch),
    [filteredStations, parsedStationSearch]
  );

  useEffect(() => {
    const justOpenedStations =
      activePanel === 'stations' && prevActivePanelRef.current !== 'stations';
    prevActivePanelRef.current = activePanel;

    if (!justOpenedStations || !playback) {
      return undefined;
    }

    const activeStationDefinition = findRadioStationDefinition(
      stationDefinitions,
      playback.stationName
    );

    if (activeStationDefinition) {
      setStationGenreFilter((currentFilter) => {
        if (
          isRadioStationInGenreFilter(
            availableStations,
            playback.stationName,
            currentFilter
          )
        ) {
          return currentFilter;
        }

        saveRadioStationGenreFilter(activeStationDefinition.genre);
        return activeStationDefinition.genre;
      });
    }

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const activeRow = stationListRef.current?.querySelector<HTMLElement>('[data-active="true"]');
        activeRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activePanel, availableStations, playback?.stationName, stationDefinitions]);

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
    ? !spectrumEnabled
      ? 'None'
      : fullscreenSource === 'bar'
        ? activeBarPreset.label
        : activeSpectrumPreset.label
    : !playback.visualizerPrefs.enabled
      ? 'None'
      : activeBarPreset.label;
  const spectrumOpacityPct = Math.round(spectrumOpacity * 100);
  const spectrumBarHeightPct = Math.round(
    resolveRadioFullscreenVisualHeightRatio(spectrumBarHeight) * 100
  );

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
          <div className={styles.stationSearch}>
            <SiteIcon
              id="search"
              className={styles.stationSearch__icon}
              sizeRem={0.9}
              title=""
            />
            <input
              type="search"
              className={styles.stationSearch__input}
              value={stationSearchQuery}
              placeholder='Search stations… ("Radio France" or #jazz)'
              aria-label="Search stations by name, description, or genre"
              onChange={(event) => {
                setStationSearchQuery(event.target.value);
              }}
            />
            {stationSearchQuery ? (
              <button
                type="button"
                className={`${styles.stationSearch__clear} no-glass`}
                aria-label="Clear station search"
                onClick={() => {
                  setStationSearchQuery('');
                }}
              >
                <SiteIcon id="close" sizeRem={0.85} title="" />
              </button>
            ) : null}
          </div>
          <div className={styles.genreFilters} role="toolbar" aria-label="Filter by genre">
            <button
              type="button"
              className={`${styles.genreFilter} no-glass`}
              aria-pressed={stationGenreFilter === null}
              onClick={() => {
                applyStationGenreFilter(null);
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
                  applyStationGenreFilter(stationGenreFilter === genre.id ? null : genre.id);
                }}
              >
                {genre.label}
              </button>
            ))}
          </div>
          <div ref={stationListRef} className={styles.stationList} role="group" aria-label="Stations">
            {displayedStations.length === 0 ? (
              <p className={styles.stationSearchEmpty}>
                No stations match{' '}
                <span className={styles.stationSearchEmpty__query}>{stationSearchQuery.trim()}</span>
              </p>
            ) : null}
            {displayedStations.map((station) => {
              const isCustom = isCustomAudioSourceDefinition(station);
              const isActiveStation = station.name === playback.stationName;
              const genreLabel = getRadioStationGenre(station.genre).label;

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
                      applyStationGenreFilter(station.genre);
                      setPlayback((current) =>
                        current ? { ...current, stationName: station.name } : current
                      );
                    }}
                  >
                    <span className={styles.stationRow__flag} aria-hidden="true">
                      {station.regionFlag}
                    </span>
                    <span className={styles.stationRow__body}>
                      <HumanFriendlySearchHighlight
                        text={station.name}
                        query={parsedStationSearch}
                        className={styles.stationRow__name}
                        highlightClassName={styles.stationSearchHighlight}
                      />
                      <span className={styles.stationRow__blurb}>
                        <HumanFriendlySearchHighlight
                          text={station.blurb}
                          query={parsedStationSearch}
                          highlightClassName={styles.stationSearchHighlight}
                        />
                      </span>
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
                  <span className={styles.stationRow__genre}>
                    <HumanFriendlySearchHighlight
                      text={genreLabel}
                      query={parsedStationSearch}
                      highlightClassName={styles.stationSearchHighlight}
                    />
                  </span>
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
            {CUSTOM_AUDIO_SOURCES_UI_ENABLED &&
              <button
                type="button"
                className={`${styles.customSourceToggle} no-glass`}
                aria-expanded={showCustomSourceForm}
                title='Custom sources are not available yet'
                onClick={() => {
                  setShowCustomSourceForm((current) => !current);
                }}
              >
                {showCustomSourceForm ? 'Hide add-source form' : 'Add your own source'}
              </button>
            }
            {CUSTOM_AUDIO_SOURCES_UI_ENABLED && showCustomSourceForm ? (
              <RadioPlayerCustomSourceForm
                onAdded={() => {
                  setShowCustomSourceForm(false);
                  applyStationGenreFilter('custom');
                }}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {activePanel === 'look' ? (
        isActive ? (
          <section className={styles.panel} aria-label="Fullscreen visualizer style">
            <div className={styles.panelSection}>
              <div className={styles.optionList} role="listbox" aria-label="Fullscreen visualizer styles">
                <button
                  type="button"
                  className={`${styles.optionRow} no-glass`}
                  role="option"
                  aria-pressed={!spectrumEnabled}
                  onClick={() => {
                    setSpectrumEnabled(false);
                  }}
                >
                  None
                </button>
                {BAR_VISUALIZER_PRESET_DEFINITIONS.map((preset) => (
                  <button
                    key={`bar-${preset.id}`}
                    type="button"
                    className={`${styles.optionRow} no-glass`}
                    role="option"
                    aria-pressed={
                      spectrumEnabled &&
                      fullscreenSource === 'bar' &&
                      preset.id === playback.visualizerPrefs.presetId
                    }
                    title={preset.description}
                    onClick={() => {
                      setFullscreenSource('bar');
                      handle.setVisualizerPreferences({ presetId: preset.id, enabled: true });
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
                {RADIO_VISUALIZER_PRESETS.map((preset, index) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.optionRow} no-glass`}
                    role="option"
                    aria-pressed={
                      spectrumEnabled &&
                      fullscreenSource === 'spectrum' &&
                      index === spectrumPresetIndex
                    }
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
              <h2 className={styles.panelSection__title}>Visualizer height</h2>
              <div className={styles.opacityControl}>
                <input
                  type="range"
                  className={`${styles.opacityControl__slider} no-glass`}
                  min={RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE.min}
                  max={RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE.max}
                  step={0.05}
                  value={spectrumBarHeight}
                  disabled={!spectrumEnabled}
                  aria-label="Fullscreen visualizer height"
                  aria-valuemin={Math.round(RADIO_FULLSCREEN_VISUAL_HEIGHT_RATIO_RANGE.min * 100)}
                  aria-valuemax={Math.round(RADIO_FULLSCREEN_VISUAL_HEIGHT_RATIO_RANGE.max * 100)}
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
                <button
                  type="button"
                  className={`${styles.optionRow} no-glass`}
                  aria-pressed={!playback.visualizerPrefs.enabled}
                  onClick={() => {
                    handle.setVisualizerPreferences({ enabled: false });
                    setPlayback((current) =>
                      current
                        ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                        : current
                    );
                  }}
                >
                  None
                </button>
                {BAR_VISUALIZER_PRESET_DEFINITIONS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.optionRow} no-glass`}
                    aria-pressed={
                      playback.visualizerPrefs.enabled &&
                      preset.id === playback.visualizerPrefs.presetId
                    }
                    title={preset.description}
                    onClick={() => {
                      handle.setVisualizerPreferences({ presetId: preset.id, enabled: true });
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

      <div ref={rowRef} className={styles.row} data-meta-resizing={isMetaResizing ? 'true' : 'false'}>
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

          <div
            ref={metaBlockRef}
            className={styles.metaBlock}
            data-custom-width={metaWidthPx !== null && !isActive ? 'true' : 'false'}
            style={
              metaWidthPx !== null && !isActive
                ? {
                  width: `${metaWidthPx}px`,
                  flex: '0 0 auto',
                }
                : undefined
            }
          >
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
                <RadioPlayerOverflowText
                  text={playback.stationName}
                  className={styles.station__name}
                />
              </button>
              {subtitle ? (
                <RadioPlayerOverflowText text={subtitle} className={styles.subtitle} as="p" />
              ) : null}
            </div>
            {!isActive ? (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Drag to widen station and track text. Double-click to reset."
                aria-valuenow={metaWidthPx ?? undefined}
                className={styles.metaResizeHandle}
                data-mappy-cursor="ew-resize"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  beginMetaResize(event.clientX);
                }}
                onDoubleClick={() => {
                  resetMetaWidth();
                }}
              />
            ) : null}
          </div>
        </div>

        {!isActive && playback.visualizerPrefs.enabled ? (
          <div
            ref={canvasHostRef}
            className={styles.viz}
            data-layout={vizDockLayout}
            aria-hidden="true"
          />
        ) : null}

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
            aria-label={
              isActive
                ? !spectrumEnabled
                  ? 'Fullscreen visualizer disabled'
                  : fullscreenSource === 'bar'
                    ? `Fullscreen bar style: ${activeBarPreset.label}`
                    : `Fullscreen spectrum style: ${activeSpectrumPreset.label}`
                : playback.visualizerPrefs.enabled
                  ? 'Bar visualizer look'
                  : 'Bar visualizer disabled'
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
