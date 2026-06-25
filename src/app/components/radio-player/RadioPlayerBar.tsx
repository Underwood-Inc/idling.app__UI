'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { isStandalonePwa } from '@lib/radio-pwa/isStandalonePwa';
import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { useRadioDockLayoutMetrics } from '@lib/hooks/useRadioDockLayoutMetrics';
import { useRadioDockInlineVisualizer } from '@lib/hooks/useRadioDockInlineVisualizer';
import { useRadioStationPanelHeight } from '@lib/hooks/useRadioStationPanelHeight';
import { useRadioMetaWidth } from '@lib/hooks/useRadioMetaWidth';
import { HumanFriendlySearchHighlight } from '@molecules/humanFriendlySearch/HumanFriendlySearchHighlight';
import { parseHumanFriendlySearchQuery } from '@molecules/humanFriendlySearch/parseHumanFriendlySearchQuery';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type {
  BarVisualizerBarFill,
  BarVisualizerBarTrail,
  BarVisualizerColorPalette,
  BarVisualizerDensity,
  BarVisualizerGlow,
  BarVisualizerPreferences,
} from '@widgets/radio-player/barVisualizer.types';
import {
  BAR_VISUALIZER_PRESET_DEFINITIONS,
  getBarVisualizerDockLayout,
  getBarVisualizerFullscreenLayout,
  isFrequencyBarsVisualizerPreset,
  isScopeVisualizerPreset,
  listBarVisualizerPresetsForSurface,
} from '@widgets/radio-player/barVisualizerPresets';
import {
  SCOPE_SMOOTHING_RANGE,
} from '@widgets/radio-player/barVisualizerPreferences';
import {
  WEBGL_VISUALIZER_PRESETS,
} from '@widgets/radio-player/webgl/webglVisualizerPresets';
import {
  RADIO_FULLSCREEN_SPECTRUM_BAR_HEIGHT_RANGE,
  RADIO_FULLSCREEN_VISUAL_HEIGHT_RATIO_RANGE,
  resolveRadioFullscreenVisualHeightRatio,
} from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import type { RadioPlayerHandle, RadioStationGenreId } from '@widgets/radio-player/radioPlayer.types';
import {
  countStationsByAvailabilityStatus,
  filterRadioStationsByGenre,
  filterRadioStationsBySearch,
  findRadioStationDefinition,
  getRadioStationAvailabilityStatus,
  getRadioStationGenre,
  isRadioStationInGenreFilter,
  listBrowsableRadioStations,
  listRadioStationGenreFiltersForStations,
  listUnreachableRadioStationsFromAvailability,
} from '@widgets/radio-player/radioStationBrowse';
import {
  loadRadioStationGenreFilter,
  saveRadioStationGenreFilter,
} from '@widgets/radio-player/radioStationGenreFilterPersistence';
import { stationSupportsTrackMetadata } from '@widgets/radio-player/radioStationMetadata';
import { RADIO_VISUALIZER_PRESETS } from '@widgets/radio-player/radioVisualizerPresets';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './RadioPlayerBar.module.css';
import { RadioPlayerBpmDisplay } from './RadioPlayerBpmDisplay';
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
    stationAvailabilityByName,
    retryStationAvailability,
    retryUnreachableStations,
  } = useRadioPlayer();
  const {
    isActive,
    isFullscreen,
    enterVisualizerMode,
    exitVisualizerMode,
    toggleDocumentFullscreen,
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
    webglPresetId,
    setWebglPresetId,
    webglVisualizerCapability,
  } = useVisualizerMode();
  const handle = handleProp ?? contextHandle;
  const playerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const metaBlockRef = useRef<HTMLDivElement>(null);
  const stationListRef = useRef<HTMLDivElement>(null);
  const stationPanelRef = useRef<HTMLElement>(null);
  const lookPanelRef = useRef<HTMLElement>(null);
  const stationSearchInputRef = useRef<HTMLInputElement>(null);
  const prevActivePanelRef = useRef<RadioPlayerPanel>(null);
  const prevLookPanelOpenRef = useRef(false);
  const lastSyncedStationRef = useRef<string | null>(null);
  const [playback, setPlayback] = useState<RadioPlayerBarPlaybackState | null>(null);
  const [activePanel, setActivePanel] = useState<RadioPlayerPanel>(null);
  const [stationGenreFilter, setStationGenreFilter] = useState<RadioStationGenreId | null>(() =>
    loadRadioStationGenreFilter()
  );
  const [stationSearchQuery, setStationSearchQuery] = useState('');
  const [showUnreachableOnly, setShowUnreachableOnly] = useState(false);

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
      const stationName = handle.getStation();
      const stationJustChanged =
        lastSyncedStationRef.current !== null && lastSyncedStationRef.current !== stationName;
      lastSyncedStationRef.current = stationName;

      const supportsTrackMetadata = stationSupportsTrackMetadata(stationName);
      const rawTrackDisplay = handle.getNowPlaying().display;
      const trackDisplay =
        supportsTrackMetadata && !stationJustChanged ? rawTrackDisplay : null;

      setPlayback({
        isPlaying: handle.isPlaying(),
        stationName,
        trackDisplay,
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
  const visualizerPresetId = playback?.visualizerPrefs.dockPresetId;
  const visualizerWaveStyle = playback?.visualizerPrefs.waveStyle ?? 'line';
  const visualizerDensity = playback?.visualizerPrefs.density;
  const visualizerEnabled = playback?.visualizerPrefs.enabled ?? true;
  const vizDockLayout = getBarVisualizerDockLayout(visualizerPresetId ?? 'wave');
  const showDockInlineVisualizer = useRadioDockInlineVisualizer();
  const { metaWidthPx, isResizing: isMetaResizing, beginResize: beginMetaResize, resetWidth: resetMetaWidth } =
    useRadioMetaWidth({
      metaBlockRef,
      rowRef,
      isFullscreen: isActive,
    });

  useLayoutEffect(() => {
    if (!handle || !playbackReady || isActive || !visualizerEnabled || !showDockInlineVisualizer) {
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
      handle.unmountBarCanvas();
    };
  }, [handle, isActive, playbackReady, showDockInlineVisualizer, visualizerEnabled, visualizerWaveStyle, visualizerPresetId, visualizerDensity]);

  useLayoutEffect(() => {
    if (!handle || !playbackReady || isActive || !visualizerEnabled || !showDockInlineVisualizer) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      handle.resizeBarCanvas();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [handle, isActive, playbackReady, showDockInlineVisualizer, visualizerPresetId, visualizerDensity, vizDockLayout, visualizerEnabled, visualizerWaveStyle]);

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
    setShowUnreachableOnly(false);
    return undefined;
  }, [activePanel]);

  useEffect(() => {
    if (activePanel !== 'stations') {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      stationSearchInputRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activePanel]);

  useRadioDockLayoutMetrics({
    playerRef,
    rowRef,
    expanded: activePanel !== null,
  });

  const {
    panelHeightPx,
    isResizing: isStationPanelResizing,
    beginResize: beginStationPanelResize,
    resetHeight: resetStationPanelHeight,
  } = useRadioStationPanelHeight({
    panelRef: stationPanelRef,
    enabled: activePanel === 'stations',
  });

  const pendingStationCount = useMemo(
    () => countStationsByAvailabilityStatus(stationAvailabilityByName, 'pending'),
    [stationAvailabilityByName]
  );
  const unreachableStationCount = useMemo(
    () => countStationsByAvailabilityStatus(stationAvailabilityByName, 'unreachable'),
    [stationAvailabilityByName]
  );

  useEffect(() => {
    if (showUnreachableOnly && unreachableStationCount === 0) {
      setShowUnreachableOnly(false);
    }
  }, [showUnreachableOnly, unreachableStationCount]);

  const stationsInPickerMode = useMemo(
    () =>
      showUnreachableOnly
        ? listUnreachableRadioStationsFromAvailability(stationDefinitions, stationAvailabilityByName)
        : listBrowsableRadioStations(stationDefinitions, stationAvailabilityByName),
    [showUnreachableOnly, stationDefinitions, stationAvailabilityByName]
  );

  const browseStations = useMemo(
    () => filterRadioStationsByGenre(stationsInPickerMode, stationGenreFilter),
    [stationsInPickerMode, stationGenreFilter]
  );

  const stationGenreFilters = useMemo(
    () => listRadioStationGenreFiltersForStations(stationsInPickerMode),
    [stationsInPickerMode]
  );

  const parsedStationSearch = useMemo(
    () => parseHumanFriendlySearchQuery(stationSearchQuery),
    [stationSearchQuery]
  );

  const displayedStations = useMemo(
    () => filterRadioStationsBySearch(browseStations, parsedStationSearch),
    [browseStations, parsedStationSearch]
  );

  useEffect(() => {
    const justOpenedStations =
      activePanel === 'stations' && prevActivePanelRef.current !== 'stations';
    prevActivePanelRef.current = activePanel;

    if (!justOpenedStations || !playback || showUnreachableOnly) {
      return undefined;
    }

    const activeStationDefinition = findRadioStationDefinition(
      stationDefinitions,
      playback.stationName
    );

    if (activeStationDefinition) {
      setStationGenreFilter((currentFilter) => {
        const visibleStations = listBrowsableRadioStations(
          stationDefinitions,
          stationAvailabilityByName
        );
        if (
          isRadioStationInGenreFilter(
            visibleStations,
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
  }, [
    activePanel,
    playback?.stationName,
    showUnreachableOnly,
    stationAvailabilityByName,
    stationDefinitions,
  ]);

  useEffect(() => {
    const isLookOpen = activePanel === 'look';
    const justOpenedLook = isLookOpen && !prevLookPanelOpenRef.current;
    prevLookPanelOpenRef.current = isLookOpen;

    if (!justOpenedLook) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const selectedOption = lookPanelRef.current?.querySelector<HTMLElement>(
          '[data-look-option="true"][aria-pressed="true"]'
        );
        selectedOption?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    activePanel,
    fullscreenSource,
    isActive,
    playback?.visualizerPrefs.dockPresetId,
    playback?.visualizerPrefs.enabled,
    playback?.visualizerPrefs.presetId,
    spectrumEnabled,
    spectrumPresetIndex,
    webglPresetId,
  ]);

  if (!handle || !playback) {
    return null;
  }

  const activeStation = findRadioStationDefinition(stationDefinitions, playback.stationName);
  const activeSpectrumPreset =
    RADIO_VISUALIZER_PRESETS[spectrumPresetIndex] ?? RADIO_VISUALIZER_PRESETS[0];
  const activeCanvasPresetId = isActive
    ? playback.visualizerPrefs.presetId
    : playback.visualizerPrefs.dockPresetId;
  const activeBarPreset =
    BAR_VISUALIZER_PRESET_DEFINITIONS.find(
      (preset) =>
        preset.id ===
        (isActive ? playback.visualizerPrefs.presetId : playback.visualizerPrefs.dockPresetId)
    ) ?? BAR_VISUALIZER_PRESET_DEFINITIONS[0];
  const activeWebglPreset =
    WEBGL_VISUALIZER_PRESETS.find((preset) => preset.id === webglPresetId) ??
    WEBGL_VISUALIZER_PRESETS[0];
  const webglPresetsAvailable = webglVisualizerCapability.isSupported;
  const activeLookLabel = isActive
    ? !spectrumEnabled
      ? 'None'
      : fullscreenSource === 'webgl' && webglPresetsAvailable
        ? activeWebglPreset.label
        : fullscreenSource === 'bar'
        ? activeBarPreset.id === 'wave' && playback.visualizerPrefs.waveStyle === 'ribbon'
          ? 'Wave ribbon'
          : activeBarPreset.label
        : activeSpectrumPreset.label
    : !playback.visualizerPrefs.enabled
      ? 'None'
      : activeBarPreset.id === 'wave' && playback.visualizerPrefs.waveStyle === 'ribbon'
        ? 'Wave ribbon'
        : activeBarPreset.label;
  const spectrumOpacityPct = Math.round(spectrumOpacity * 100);
  const spectrumBarHeightPct = Math.round(
    resolveRadioFullscreenVisualHeightRatio(spectrumBarHeight) * 100
  );

  const subtitle = (() => {
    if (!playback.isPlaying) {
      return 'Press play to start';
    }

    if (
      stationSupportsTrackMetadata(playback.stationName) &&
      isUsableTrackDisplay(playback.trackDisplay)
    ) {
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
      data-station-panel-resizing={isStationPanelResizing ? 'true' : 'false'}
    >
      {activePanel === 'stations' ? (
        <section
          ref={stationPanelRef}
          className={`${styles.panel} ${styles.panelStations}`}
          style={
            panelHeightPx !== null
              ? {
                  height: `${panelHeightPx}px`,
                }
              : undefined
          }
          aria-label="Choose a station"
        >
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Drag to resize station list. Double-click to reset height."
            aria-valuenow={panelHeightPx ?? undefined}
            className={styles.stationPanelResizeHandle}
            data-mappy-cursor="ns-resize"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              beginStationPanelResize(event.clientY);
            }}
            onDoubleClick={() => {
              resetStationPanelHeight();
            }}
          />
          <div className={styles.stationPickerHeader}>
            <div className={styles.stationSearch}>
              <SiteIcon
                id="search"
                className={styles.stationSearch__icon}
                sizeRem={0.9}
                title=""
              />
              <input
                ref={stationSearchInputRef}
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
            {pendingStationCount > 0 ? (
              <p className={styles.stationProbeStatus} role="status" aria-live="polite">
                Checking {pendingStationCount} station{pendingStationCount === 1 ? '' : 's'}…
              </p>
            ) : null}
            <div className={styles.genreFilters} role="toolbar" aria-label="Filter by genre">
              <button
                type="button"
                className={`${styles.genreFilter} no-glass`}
                aria-pressed={stationGenreFilter === null}
                onClick={() => {
                  applyStationGenreFilter(null);
                }}
              >
                <span className={styles.genreFilter__label}>All</span>
                <span className={styles.genreFilter__badge}>{stationsInPickerMode.length}</span>
              </button>
              {stationGenreFilters.map(({ genre, count }) => (
                <button
                  key={genre.id}
                  type="button"
                  className={`${styles.genreFilter} no-glass`}
                  aria-pressed={stationGenreFilter === genre.id}
                  onClick={() => {
                    applyStationGenreFilter(stationGenreFilter === genre.id ? null : genre.id);
                  }}
                >
                  <span className={styles.genreFilter__label}>{genre.label}</span>
                  <span className={styles.genreFilter__badge}>{count}</span>
                </button>
              ))}
              {unreachableStationCount > 0 ? (
                <button
                  type="button"
                  className={`${styles.genreFilter} ${styles.genreFilterUnreachable} no-glass`}
                  aria-pressed={showUnreachableOnly}
                  onClick={() => {
                    setShowUnreachableOnly((current) => !current);
                  }}
                >
                  <span className={styles.genreFilter__label}>Unreachable</span>
                  <span className={styles.genreFilter__badge}>{unreachableStationCount}</span>
                </button>
              ) : null}
              {showUnreachableOnly && unreachableStationCount > 0 ? (
                <button
                  type="button"
                  className={`${styles.genreFilter} ${styles.genreFilterRetryAll} no-glass`}
                  onClick={() => {
                    retryUnreachableStations();
                  }}
                >
                  <span className={styles.genreFilter__label}>Re-check all</span>
                </button>
              ) : null}
            </div>
          </div>
          <div ref={stationListRef} className={styles.stationListScroll}>
            <div className={styles.stationList} role="group" aria-label="Stations">
            {displayedStations.length === 0 ? (
              <p className={styles.stationSearchEmpty}>
                {showUnreachableOnly
                  ? 'No unreachable stations match this filter.'
                  : (
                    <>
                      No stations match{' '}
                      <span className={styles.stationSearchEmpty__query}>
                        {stationSearchQuery.trim()}
                      </span>
                    </>
                  )}
              </p>
            ) : null}
            {displayedStations.map((station) => {
              const isActiveStation = station.name === playback.stationName;
              const genreLabel = getRadioStationGenre(station.genre).label;
              const availability = stationAvailabilityByName[station.name];
              const probeStatus = getRadioStationAvailabilityStatus(
                stationAvailabilityByName,
                station.name
              );
              const isUnreachable = probeStatus === 'unreachable';
              const isChecking = probeStatus === 'pending';

              return (
                <div
                  key={station.name}
                  className={styles.stationRow}
                  data-active={isActiveStation ? 'true' : 'false'}
                  data-unreachable={isUnreachable ? 'true' : 'false'}
                  data-probe-status={probeStatus}
                >
                  <button
                    type="button"
                    className={`${styles.stationRow__select} no-glass`}
                    aria-pressed={isActiveStation}
                    disabled={isUnreachable}
                    title={availability?.reason}
                    onClick={() => {
                      if (isUnreachable) {
                        return;
                      }

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
                      <span className={styles.stationRow__nameRow}>
                        <HumanFriendlySearchHighlight
                          text={station.name}
                          query={parsedStationSearch}
                          className={styles.stationRow__name}
                          highlightClassName={styles.stationSearchHighlight}
                        />
                        {isChecking ? (
                          <SiteIcon
                            id="loader"
                            className={styles.stationRow__checkingIcon}
                            sizeRem={0.85}
                            title="Checking stream"
                          />
                        ) : null}
                      </span>
                      <span className={styles.stationRow__blurb}>
                        {isUnreachable && availability?.reason ? (
                          availability.reason
                        ) : isChecking ? (
                          'Checking stream availability…'
                        ) : (
                          <HumanFriendlySearchHighlight
                            text={station.blurb}
                            query={parsedStationSearch}
                            highlightClassName={styles.stationSearchHighlight}
                          />
                        )}
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
                  {isUnreachable ? (
                    <button
                      type="button"
                      className={`${styles.stationRow__retry} no-glass`}
                      aria-label={`Re-check ${station.name}`}
                      title={`Re-check ${station.name}`}
                      onClick={() => {
                        retryStationAvailability([station.name]);
                      }}
                    >
                      <SiteIcon id="refresh" sizeRem={0.85} title="" />
                    </button>
                  ) : (
                    <span className={styles.stationRow__removeSpacer} aria-hidden="true" />
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </section>
      ) : null}

      {activePanel === 'look' ? (
        isActive ? (
          <section ref={lookPanelRef} className={styles.panel} aria-label="Fullscreen visualizer style">
            <div className={styles.panelSection}>
              <div className={styles.optionList} role="listbox" aria-label="Fullscreen visualizer styles">
                <button
                  type="button"
                  className={`${styles.optionRow} no-glass`}
                  role="option"
                  data-look-option="true"
                  aria-pressed={!spectrumEnabled}
                  onClick={() => {
                    setSpectrumEnabled(false);
                  }}
                >
                  None
                </button>
                {webglPresetsAvailable
                  ? WEBGL_VISUALIZER_PRESETS.map((preset) => (
                  <button
                    key={`webgl-${preset.id}`}
                    type="button"
                    className={`${styles.optionRow} no-glass`}
                    role="option"
                    data-look-option="true"
                    aria-pressed={
                      spectrumEnabled &&
                      fullscreenSource === 'webgl' &&
                      preset.id === webglPresetId
                    }
                    title={preset.description}
                    onClick={() => {
                      setWebglPresetId(preset.id);
                    }}
                  >
                    {preset.label}
                  </button>
                ))
                  : null}
                {webglVisualizerCapability.isResolved && !webglPresetsAvailable ? (
                  <p className={styles.panelSection__note} role="note">
                    {webglVisualizerCapability.reason ??
                      'WebGL2 visualizers are not available in this browser.'}
                  </p>
                ) : null}
                {listBarVisualizerPresetsForSurface('expanded').map((preset) => (
                  <button
                    key={`bar-${preset.id}`}
                    type="button"
                    className={`${styles.optionRow} no-glass`}
                    role="option"
                    data-look-option="true"
                    aria-pressed={
                      spectrumEnabled &&
                      fullscreenSource === 'bar' &&
                      preset.id === playback.visualizerPrefs.presetId
                    }
                    title={preset.description}
                    onClick={() => {
                      setFullscreenSource('bar');
                      handle.setVisualizerPreferences({
                        presetId: preset.id,
                        enabled: true,
                        ...(preset.fullscreenOnly ? {} : { dockPresetId: preset.id }),
                      });
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
                    data-look-option="true"
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
            {spectrumEnabled &&
            fullscreenSource === 'bar' &&
            playback.visualizerPrefs.presetId === 'wave' ? (
              <div className={styles.panelSection}>
                <h2 className={styles.panelSection__title}>Wave style</h2>
                <div className={styles.segments} role="group" aria-label="Wave line style">
                  {(['line', 'ribbon'] as const).map((waveStyle) => (
                    <button
                      key={waveStyle}
                      type="button"
                      className={`${styles.segment} no-glass`}
                      aria-pressed={playback.visualizerPrefs.waveStyle === waveStyle}
                      onClick={() => {
                        handle.setVisualizerPreferences({ waveStyle });
                        setPlayback((current) =>
                          current
                            ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                            : current
                        );
                      }}
                    >
                      {waveStyle === 'line' ? 'Line' : 'Ribbon'}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {spectrumEnabled &&
            fullscreenSource === 'bar' &&
            playback.visualizerPrefs.enabled &&
            isScopeVisualizerPreset(playback.visualizerPrefs.presetId) ? (
              <div className={styles.panelSection}>
                <h2 className={styles.panelSection__title}>Wave smoothing</h2>
                <div className={styles.opacityControl}>
                  <input
                    type="range"
                    className={`${styles.opacityControl__slider} no-glass`}
                    min={SCOPE_SMOOTHING_RANGE.min}
                    max={SCOPE_SMOOTHING_RANGE.max}
                    step={SCOPE_SMOOTHING_RANGE.step}
                    value={playback.visualizerPrefs.scopeSmoothing}
                    aria-label="Oscilloscope wave smoothing"
                    aria-valuemin={Math.round(SCOPE_SMOOTHING_RANGE.min * 100)}
                    aria-valuemax={Math.round(SCOPE_SMOOTHING_RANGE.max * 100)}
                    aria-valuenow={Math.round(playback.visualizerPrefs.scopeSmoothing * 100)}
                    aria-valuetext={`${Math.round(playback.visualizerPrefs.scopeSmoothing * 100)} percent`}
                    onChange={(event) => {
                      handle.setVisualizerPreferences({ scopeSmoothing: Number(event.target.value) });
                      setPlayback((current) =>
                        current
                          ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                          : current
                      );
                    }}
                  />
                  <span className={styles.opacityControl__pct} aria-hidden="true">
                    {Math.round(playback.visualizerPrefs.scopeSmoothing * 100)}
                  </span>
                </div>
              </div>
            ) : null}
            {spectrumEnabled &&
            fullscreenSource === 'bar' &&
            playback.visualizerPrefs.enabled &&
            isFrequencyBarsVisualizerPreset(playback.visualizerPrefs.presetId) ? (
              <>
                <div className={styles.panelSection}>
                  <h2 className={styles.panelSection__title}>Bar fill</h2>
                  <div className={styles.segments} role="group" aria-label="Bar fill style">
                    {(
                      [
                        { value: 'solid', label: 'Solid' },
                        { value: 'glass', label: 'Glass' },
                      ] as const satisfies { value: BarVisualizerBarFill; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.segment} no-glass`}
                        aria-pressed={playback.visualizerPrefs.barFill === option.value}
                        onClick={() => {
                          handle.setVisualizerPreferences({ barFill: option.value });
                          setPlayback((current) =>
                            current
                              ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                              : current
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.panelSection}>
                  <h2 className={styles.panelSection__title}>Trail</h2>
                  <div className={styles.segments} role="group" aria-label="Bar trail style">
                    {(
                      [
                        { value: 'none', label: 'None' },
                        { value: 'peaks', label: 'Peaks' },
                        { value: 'cascade', label: 'Cascade' },
                      ] as const satisfies { value: BarVisualizerBarTrail; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.segment} no-glass`}
                        aria-pressed={playback.visualizerPrefs.barTrail === option.value}
                        onClick={() => {
                          handle.setVisualizerPreferences({ barTrail: option.value });
                          setPlayback((current) =>
                            current
                              ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                              : current
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.panelSection}>
                  <h2 className={styles.panelSection__title}>Glow</h2>
                  <div className={styles.segments} role="group" aria-label="Bar glow">
                    {(
                      [
                        { value: 'off', label: 'Off' },
                        { value: 'soft', label: 'Soft' },
                      ] as const satisfies { value: BarVisualizerGlow; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.segment} no-glass`}
                        aria-pressed={playback.visualizerPrefs.glow === option.value}
                        onClick={() => {
                          handle.setVisualizerPreferences({ glow: option.value });
                          setPlayback((current) =>
                            current
                              ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                              : current
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.panelSection}>
                  <h2 className={styles.panelSection__title}>Colors</h2>
                  <div className={styles.segments} role="group" aria-label="Visualizer colors">
                    {(
                      [
                        { value: 'theme', label: 'Theme' },
                        { value: 'prism', label: 'Prism' },
                      ] as const satisfies { value: BarVisualizerColorPalette; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.segment} no-glass`}
                        aria-pressed={playback.visualizerPrefs.colorPalette === option.value}
                        onClick={() => {
                          handle.setVisualizerPreferences({ colorPalette: option.value });
                          setPlayback((current) =>
                            current
                              ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                              : current
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
            <div className={styles.panelSection}>
              <h2 className={styles.panelSection__title}>Opacity</h2>
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
                  disabled={
                    !spectrumEnabled ||
                    fullscreenSource === 'webgl' ||
                    (spectrumEnabled &&
                      fullscreenSource === 'bar' &&
                      getBarVisualizerFullscreenLayout(playback.visualizerPrefs.presetId) !== 'strip')
                  }
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
          <section ref={lookPanelRef} className={styles.panel} aria-label="Bar visualizer look">
            <div className={styles.panelSection}>
              <h2 className={styles.panelSection__title}>Bar style</h2>
              <div className={styles.optionList} role="group" aria-label="Bar visualizer styles">
                <button
                  type="button"
                  className={`${styles.optionRow} no-glass`}
                  data-look-option="true"
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
                {listBarVisualizerPresetsForSurface('dock').map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.optionRow} no-glass`}
                    data-look-option="true"
                    aria-pressed={
                      playback.visualizerPrefs.enabled &&
                      preset.id === playback.visualizerPrefs.dockPresetId
                    }
                    title={preset.description}
                    onClick={() => {
                      handle.setVisualizerPreferences({
                        presetId: preset.id,
                        dockPresetId: preset.id,
                        enabled: true,
                      });
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
            {playback.visualizerPrefs.enabled && playback.visualizerPrefs.dockPresetId === 'wave' ? (
              <div className={styles.panelSection}>
                <h2 className={styles.panelSection__title}>Wave style</h2>
                <div className={styles.segments} role="group" aria-label="Wave line style">
                  {(['line', 'ribbon'] as const).map((waveStyle) => (
                    <button
                      key={waveStyle}
                      type="button"
                      className={`${styles.segment} no-glass`}
                      aria-pressed={playback.visualizerPrefs.waveStyle === waveStyle}
                      onClick={() => {
                        handle.setVisualizerPreferences({ waveStyle });
                        setPlayback((current) =>
                          current
                            ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                            : current
                        );
                      }}
                    >
                      {waveStyle === 'line' ? 'Line' : 'Ribbon'}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {playback.visualizerPrefs.enabled &&
            isScopeVisualizerPreset(playback.visualizerPrefs.dockPresetId) ? (
              <div className={styles.panelSection}>
                <h2 className={styles.panelSection__title}>Wave smoothing</h2>
                <div className={styles.opacityControl}>
                  <input
                    type="range"
                    className={`${styles.opacityControl__slider} no-glass`}
                    min={SCOPE_SMOOTHING_RANGE.min}
                    max={SCOPE_SMOOTHING_RANGE.max}
                    step={SCOPE_SMOOTHING_RANGE.step}
                    value={playback.visualizerPrefs.scopeSmoothing}
                    aria-label="Oscilloscope wave smoothing"
                    aria-valuemin={Math.round(SCOPE_SMOOTHING_RANGE.min * 100)}
                    aria-valuemax={Math.round(SCOPE_SMOOTHING_RANGE.max * 100)}
                    aria-valuenow={Math.round(playback.visualizerPrefs.scopeSmoothing * 100)}
                    aria-valuetext={`${Math.round(playback.visualizerPrefs.scopeSmoothing * 100)} percent`}
                    onChange={(event) => {
                      handle.setVisualizerPreferences({ scopeSmoothing: Number(event.target.value) });
                      setPlayback((current) =>
                        current
                          ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                          : current
                      );
                    }}
                  />
                  <span className={styles.opacityControl__pct} aria-hidden="true">
                    {Math.round(playback.visualizerPrefs.scopeSmoothing * 100)}
                  </span>
                </div>
              </div>
            ) : null}
            {playback.visualizerPrefs.enabled &&
            isFrequencyBarsVisualizerPreset(playback.visualizerPrefs.dockPresetId) ? (
              <>
                <div className={styles.panelSection}>
                  <h2 className={styles.panelSection__title}>Bar fill</h2>
                  <div className={styles.segments} role="group" aria-label="Bar fill style">
                    {(
                      [
                        { value: 'solid', label: 'Solid' },
                        { value: 'glass', label: 'Glass' },
                      ] as const satisfies { value: BarVisualizerBarFill; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.segment} no-glass`}
                        aria-pressed={playback.visualizerPrefs.barFill === option.value}
                        onClick={() => {
                          handle.setVisualizerPreferences({ barFill: option.value });
                          setPlayback((current) =>
                            current
                              ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                              : current
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.panelSection}>
                  <h2 className={styles.panelSection__title}>Trail</h2>
                  <div className={styles.segments} role="group" aria-label="Bar trail style">
                    {(
                      [
                        { value: 'none', label: 'None' },
                        { value: 'peaks', label: 'Peaks' },
                        { value: 'cascade', label: 'Cascade' },
                      ] as const satisfies { value: BarVisualizerBarTrail; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.segment} no-glass`}
                        aria-pressed={playback.visualizerPrefs.barTrail === option.value}
                        onClick={() => {
                          handle.setVisualizerPreferences({ barTrail: option.value });
                          setPlayback((current) =>
                            current
                              ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                              : current
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.panelSection}>
                  <h2 className={styles.panelSection__title}>Glow</h2>
                  <div className={styles.segments} role="group" aria-label="Bar glow">
                    {(
                      [
                        { value: 'off', label: 'Off' },
                        { value: 'soft', label: 'Soft' },
                      ] as const satisfies { value: BarVisualizerGlow; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.segment} no-glass`}
                        aria-pressed={playback.visualizerPrefs.glow === option.value}
                        onClick={() => {
                          handle.setVisualizerPreferences({ glow: option.value });
                          setPlayback((current) =>
                            current
                              ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                              : current
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.panelSection}>
                  <h2 className={styles.panelSection__title}>Colors</h2>
                  <div className={styles.segments} role="group" aria-label="Visualizer colors">
                    {(
                      [
                        { value: 'theme', label: 'Theme' },
                        { value: 'prism', label: 'Prism' },
                      ] as const satisfies { value: BarVisualizerColorPalette; label: string }[]
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.segment} no-glass`}
                        aria-pressed={playback.visualizerPrefs.colorPalette === option.value}
                        onClick={() => {
                          handle.setVisualizerPreferences({ colorPalette: option.value });
                          setPlayback((current) =>
                            current
                              ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                              : current
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
            <div className={styles.panelSection}>
              <h2 className={styles.panelSection__title}>Density</h2>
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

        {!isActive && playback.visualizerPrefs.enabled && showDockInlineVisualizer ? (
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

          <RadioPlayerBpmDisplay isPlaying={playback.isPlaying} />

          <span className={styles.divider} aria-hidden="true" />

          <button
            type="button"
            className={`${styles.textBtn} no-glass`}
            aria-pressed={activePanel === 'look'}
            aria-label={
              isActive
                ? !spectrumEnabled
                  ? 'Fullscreen visualizer disabled'
                  : fullscreenSource === 'webgl' && webglPresetsAvailable
                    ? `Fullscreen WebGL style: ${activeWebglPreset.label}`
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
          {isStandalonePwa() ? (
            <button
              type="button"
              className={`${styles.textBtn} ${isFullscreen ? styles.textBtnExit : ''} no-glass`}
              aria-pressed={isFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              data-testid="radio-pwa-document-fullscreen-trigger"
              onClick={() => {
                void toggleDocumentFullscreen();
              }}
            >
              <SiteIcon id={isFullscreen ? 'close' : 'maximize'} sizeRem={0.9} title="" />
              <span className={styles.textBtn__label}>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
