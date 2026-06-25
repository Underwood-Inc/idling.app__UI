'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { isStandalonePwa } from '@lib/radio-pwa/isStandalonePwa';
import { useVisualizerMode } from '@lib/context/VisualizerModeContext';
import { useRadioDockLayoutMetrics } from '@lib/hooks/useRadioDockLayoutMetrics';
import { useRadioDockInlineVisualizer } from '@lib/hooks/useRadioDockInlineVisualizer';
import { useRadioMediaSession } from '@lib/hooks/useRadioMediaSession';
import { useRadioStationFavorites } from '@lib/hooks/useRadioStationFavorites';
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
  BarVisualizerDockLayoutMode,
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
  DOCK_OPACITY_RANGE,
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
  countFavoriteStationsInList,
  filterRadioStationsByFavorites,
  sortRadioStationsByFavoriteRecency,
  sortRadioStationsWithFavoritesFirst,
} from '@widgets/radio-player/radioStationFavorites';
import {
  buildRadioStationNavigationOrder,
  resolveAdjacentRadioStation,
} from '@widgets/radio-player/radioStationNavigation';
import type { RadioStationNavigationDirection } from '@widgets/radio-player/radioStationNavigation';
import {
  loadRadioStationGenreFilter,
  saveRadioStationGenreFilter,
} from '@widgets/radio-player/radioStationGenreFilterPersistence';
import { stationSupportsTrackMetadata } from '@widgets/radio-player/radioStationMetadata';
import { isUsableRadioNowPlayingSearchDisplay } from '@widgets/radio-player/radioNowPlayingSearch';
import { RADIO_VISUALIZER_PRESETS } from '@widgets/radio-player/radioVisualizerPresets';
import { RADIO_VISUALIZER_GRADIENT_OPTIONS } from '@widgets/radio-player/radioVisualizerGradients';
import {
  isRadioSpectrumGradientPickerPreset,
  resolveSpectrumGradientForPreset,
} from '@widgets/radio-player/radioVisualizerSpectrumColors';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './RadioPlayerBar.module.css';
import { RadioPlayerBpmDisplay } from './RadioPlayerBpmDisplay';
import { RadioPlayerEqualizerPanel } from './RadioPlayerEqualizerPanel';
import { RadioPlayerPanelResizeHandle } from './RadioPlayerPanelResizeHandle';
import { RadioPlayerVolumeFader } from './RadioPlayerVolumeFader';
import { RadioPlayerTrackTitleTip } from './RadioPlayerTrackTitleTip';
import { RadioPlayerOverflowText } from './RadioPlayerOverflowText';
import { RadioPlayerTrackSearchButton } from './RadioPlayerTrackSearchButton';

export interface RadioPlayerBarPlaybackState {
  isPlaying: boolean;
  stationName: string;
  trackDisplay: string | null;
  volume: number;
  visualizerPrefs: BarVisualizerPreferences;
}

export type RadioPlayerPanel = 'stations' | 'settings' | null;

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

export function RadioPlayerVolumeStepper({ volume, onChange }: RadioPlayerVolumeStepperProps) {
  const pct = Math.round(volume * 100);
  const isMuted = volume === 0;

  return (
    <div className={styles.volume} data-volume={pct}>
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
      <RadioPlayerVolumeFader volume={volume} onChange={onChange} />
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
    spectrumGradientByPreset,
    setSpectrumGradientForPreset,
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
  const settingsPanelRef = useRef<HTMLElement>(null);
  const lookPanelRef = useRef<HTMLDivElement>(null);
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const {
    favoriteStationNames,
    favoriteStationNameSet,
    isFavorite,
    toggleFavorite,
  } = useRadioStationFavorites();

  const applyStationGenreFilter = useCallback((genreId: RadioStationGenreId | null) => {
    setStationGenreFilter(genreId);
    saveRadioStationGenreFilter(genreId);
  }, []);

  const syncPlaybackFromHandle = useCallback(() => {
    if (!handle) {
      return;
    }

    setPlayback((current) =>
      current
        ? {
            ...current,
            isPlaying: handle.isPlaying(),
            stationName: handle.getStation(),
            volume: handle.getVolume(),
          }
        : current
    );
  }, [handle]);

  const selectStation = useCallback(
    (stationName: string, options?: { closePanel?: boolean }) => {
      if (!handle) {
        return;
      }

      const station = findRadioStationDefinition(stationDefinitions, stationName);
      if (!station) {
        return;
      }

      const probeStatus = getRadioStationAvailabilityStatus(stationAvailabilityByName, stationName);
      if (probeStatus === 'unreachable') {
        return;
      }

      handle.setStation(stationName);
      if (options?.closePanel !== false) {
        setActivePanel(null);
      }
      applyStationGenreFilter(station.genre);
      setPlayback((current) =>
        current ? { ...current, stationName } : current
      );
    },
    [applyStationGenreFilter, handle, stationAvailabilityByName, stationDefinitions]
  );

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
  const showDockInlineVisualizer = useRadioDockInlineVisualizer();
  const dockLayoutMode: BarVisualizerDockLayoutMode =
    playback?.visualizerPrefs.dockLayoutMode ?? 'backdrop';
  const dockVisualizerOpacity = playback?.visualizerPrefs.dockOpacity ?? DOCK_OPACITY_RANGE.default;
  const dockVisualizerOpacityPct = Math.round(dockVisualizerOpacity * 100);
  const showDockVizBackdrop =
    !isActive &&
    visualizerEnabled &&
    dockLayoutMode === 'backdrop';
  const showDockVizInline =
    !isActive &&
    visualizerEnabled &&
    showDockInlineVisualizer &&
    dockLayoutMode === 'inline';
  const vizDockLayout = getBarVisualizerDockLayout(visualizerPresetId ?? 'wave');
  const useExpandedMetaLayout = isActive || showDockVizBackdrop;
  const { metaWidthPx, isResizing: isMetaResizing, beginResize: beginMetaResize, resetWidth: resetMetaWidth } =
    useRadioMetaWidth({
      metaBlockRef,
      rowRef,
      isFullscreen: useExpandedMetaLayout,
    });

  useLayoutEffect(() => {
    if (!handle || !playbackReady || isActive || !visualizerEnabled) {
      return undefined;
    }

    if (!showDockVizBackdrop && !showDockVizInline) {
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
  }, [handle, isActive, playbackReady, showDockVizBackdrop, showDockVizInline, visualizerEnabled, visualizerWaveStyle, visualizerPresetId, visualizerDensity, dockLayoutMode]);

  useLayoutEffect(() => {
    if (!handle || !playbackReady || isActive || !visualizerEnabled) {
      return undefined;
    }

    if (!showDockVizBackdrop && !showDockVizInline) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      handle.resizeBarCanvas();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [handle, isActive, playbackReady, showDockVizBackdrop, showDockVizInline, visualizerPresetId, visualizerDensity, vizDockLayout, visualizerEnabled, visualizerWaveStyle, dockLayoutMode]);

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

  const controlBarPanelRef = activePanel === 'settings' ? settingsPanelRef : stationPanelRef;

  const {
    panelHeightPx,
    isPanelHeightResolved: isControlBarPanelHeightResolved,
    isResizing: isControlBarPanelResizing,
    beginResize: beginControlBarPanelResize,
    resetHeight: resetControlBarPanelHeight,
  } = useRadioStationPanelHeight({
    panelRef: controlBarPanelRef,
    enabled: activePanel !== null,
  });

  useRadioDockLayoutMetrics({
    playerRef,
    rowRef,
    expanded: activePanel !== null && isControlBarPanelHeightResolved,
  });

  useEffect(() => {
    if (activePanel !== 'stations' || !isControlBarPanelHeightResolved) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      stationSearchInputRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activePanel, isControlBarPanelHeightResolved]);

  const controlBarPanelStyle =
    panelHeightPx !== null
      ? {
          height: `${panelHeightPx}px`,
        }
      : undefined;

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

  const navigationStationNames = useMemo(
    () =>
      buildRadioStationNavigationOrder({
        stations: stationDefinitions,
        availabilityByName: stationAvailabilityByName,
        favoriteOrder: favoriteStationNames,
      }),
    [favoriteStationNames, stationAvailabilityByName, stationDefinitions]
  );

  const skipStation = useCallback(
    (direction: RadioStationNavigationDirection) => {
      if (!playback || !handle) {
        return;
      }

      const wasPlaying = playback.isPlaying;
      const nextStationName = resolveAdjacentRadioStation({
        stationNames: navigationStationNames,
        currentStationName: playback.stationName,
        direction,
      });

      if (!nextStationName) {
        return;
      }

      selectStation(nextStationName, { closePanel: false });

      if (wasPlaying) {
        window.setTimeout(() => {
          void handle.play().then(() => {
            syncPlaybackFromHandle();
          });
        }, 0);
      }
    },
    [handle, navigationStationNames, playback, selectStation, syncPlaybackFromHandle]
  );

  useRadioMediaSession({
    handle,
    stationDefinitions,
    stationName: playback?.stationName ?? null,
    trackDisplay: playback?.trackDisplay ?? null,
    isPlaying: playback?.isPlaying ?? false,
    onNextStation: () => {
      skipStation('next');
    },
    onPreviousStation: () => {
      skipStation('previous');
    },
    onPlaybackSync: syncPlaybackFromHandle,
  });

  const favoriteStationCount = useMemo(
    () => countFavoriteStationsInList(stationsInPickerMode, favoriteStationNameSet),
    [favoriteStationNameSet, stationsInPickerMode]
  );

  useEffect(() => {
    if (showFavoritesOnly && favoriteStationCount === 0) {
      setShowFavoritesOnly(false);
    }
  }, [favoriteStationCount, showFavoritesOnly]);

  const browseStations = useMemo(() => {
    const genreFiltered = filterRadioStationsByGenre(stationsInPickerMode, stationGenreFilter);
    const favoriteFiltered = filterRadioStationsByFavorites(
      genreFiltered,
      favoriteStationNameSet,
      showFavoritesOnly
    );

    if (showFavoritesOnly) {
      return sortRadioStationsByFavoriteRecency(favoriteFiltered, favoriteStationNames);
    }

    return sortRadioStationsWithFavoritesFirst(favoriteFiltered, favoriteStationNames);
  }, [
    favoriteStationNameSet,
    favoriteStationNames,
    showFavoritesOnly,
    stationGenreFilter,
    stationsInPickerMode,
  ]);

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
    const isSettingsOpen = activePanel === 'settings';
    const justOpenedLook = isSettingsOpen && !prevLookPanelOpenRef.current;
    prevLookPanelOpenRef.current = isSettingsOpen;

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
  const isCurrentStationFavorite = isFavorite(playback.stationName);
  const canSkipStations = navigationStationNames.length > 1;
  const activeSpectrumPreset =
    RADIO_VISUALIZER_PRESETS[spectrumPresetIndex] ?? RADIO_VISUALIZER_PRESETS[0];
  const activeSpectrumGradientId = resolveSpectrumGradientForPreset(
    activeSpectrumPreset.id,
    spectrumGradientByPreset
  );
  const showSpectrumGradientPicker =
    spectrumEnabled &&
    fullscreenSource === 'spectrum' &&
    isRadioSpectrumGradientPickerPreset(activeSpectrumPreset.id);
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
      isUsableRadioNowPlayingSearchDisplay(playback.trackDisplay)
    ) {
      return playback.trackDisplay;
    }

    if (activeStation) {
      return `${getRadioStationGenre(activeStation.genre).label} · ${activeStation.blurb}`;
    }

    return null;
  })();

  const hasReportedTrack =
    playback.isPlaying &&
    stationSupportsTrackMetadata(playback.stationName) &&
    isUsableRadioNowPlayingSearchDisplay(playback.trackDisplay);

  const togglePanel = (panel: RadioPlayerPanel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  return (
    <div
      ref={playerRef}
      className={styles.player}
      data-expanded={activePanel !== null && isControlBarPanelHeightResolved}
      data-visualizer-mode={isActive ? 'true' : 'false'}
      data-dock-viz-backdrop={showDockVizBackdrop ? 'true' : 'false'}
      role="region"
      aria-label="Radio player"
      data-testid="radio-player-bar"
      data-panel-resizing={isControlBarPanelResizing ? 'true' : 'false'}
    >
      {activePanel === 'stations' && isControlBarPanelHeightResolved ? (
        <section
          ref={stationPanelRef}
          className={`${styles.panel} ${styles.panelStations} ${styles.panelResizable}`}
          data-custom-height={panelHeightPx !== null ? 'true' : 'false'}
          style={controlBarPanelStyle}
          aria-label="Choose a station"
        >
          <RadioPlayerPanelResizeHandle
            panelHeightPx={panelHeightPx}
            onBeginResize={beginControlBarPanelResize}
            onResetHeight={resetControlBarPanelHeight}
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
                aria-pressed={stationGenreFilter === null && !showFavoritesOnly}
                onClick={() => {
                  applyStationGenreFilter(null);
                  setShowFavoritesOnly(false);
                }}
              >
                <span className={styles.genreFilter__label}>All</span>
                <span className={styles.genreFilter__badge}>{stationsInPickerMode.length}</span>
              </button>
              {favoriteStationCount > 0 ? (
                <button
                  type="button"
                  className={`${styles.genreFilter} ${styles.genreFilterFavorites} no-glass`}
                  aria-pressed={showFavoritesOnly}
                  onClick={() => {
                    setShowUnreachableOnly(false);
                    setShowFavoritesOnly((current) => !current);
                  }}
                >
                  <SiteIcon
                    id="star"
                    className={styles.genreFilter__icon}
                    sizeRem={0.75}
                    title=""
                  />
                  <span className={styles.genreFilter__label}>Favorites</span>
                  <span className={styles.genreFilter__badge}>{favoriteStationCount}</span>
                </button>
              ) : null}
              {stationGenreFilters.map(({ genre, count }) => (
                <button
                  key={genre.id}
                  type="button"
                  className={`${styles.genreFilter} no-glass`}
                  aria-pressed={stationGenreFilter === genre.id}
                  onClick={() => {
                    applyStationGenreFilter(stationGenreFilter === genre.id ? null : genre.id);
                    setShowFavoritesOnly(false);
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
                    setShowFavoritesOnly(false);
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
                  : showFavoritesOnly
                    ? 'No favorite stations match this filter.'
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

              const isFavoriteStation = isFavorite(station.name);

              return (
                <div
                  key={station.name}
                  className={styles.stationRow}
                  data-active={isActiveStation ? 'true' : 'false'}
                  data-favorite={isFavoriteStation ? 'true' : 'false'}
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
                      selectStation(station.name);
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
                  <button
                    type="button"
                    className={`${styles.stationRow__favorite} no-glass`}
                    aria-pressed={isFavoriteStation}
                    aria-label={
                      isFavoriteStation
                        ? `Remove ${station.name} from favorites`
                        : `Add ${station.name} to favorites`
                    }
                    title={
                      isFavoriteStation
                        ? `Remove ${station.name} from favorites`
                        : `Add ${station.name} to favorites`
                    }
                    onClick={() => {
                      void toggleFavorite(station.name);
                    }}
                  >
                    <SiteIcon id="star" sizeRem={0.9} title="" />
                  </button>
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

      {activePanel === 'settings' && isControlBarPanelHeightResolved ? (
        <section
          ref={settingsPanelRef}
          className={`${styles.panel} ${styles.panelSettings} ${styles.panelResizable}`}
          data-custom-height={panelHeightPx !== null ? 'true' : 'false'}
          style={controlBarPanelStyle}
          aria-label="Player settings"
        >
          <RadioPlayerPanelResizeHandle
            panelHeightPx={panelHeightPx}
            onBeginResize={beginControlBarPanelResize}
            onResetHeight={resetControlBarPanelHeight}
          />
          <div className={styles.panelBodyScroll}>
          <RadioPlayerEqualizerPanel handle={handle} />
        {isActive ? (
          <div ref={lookPanelRef} className={styles.settingsSection} aria-label="Fullscreen visualizer style">
            <h2 className={styles.panelSection__title}>Look</h2>
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
            {showSpectrumGradientPicker ? (
              <div className={styles.panelSection}>
                <h2 className={styles.panelSection__title}>Colors</h2>
                <div
                  className={styles.gradientSwatches}
                  role="group"
                  aria-label="Spectrum visualizer colors"
                >
                  {RADIO_VISUALIZER_GRADIENT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.gradientSwatch} no-glass`}
                      aria-pressed={activeSpectrumGradientId === option.id}
                      aria-label={option.label}
                      title={option.label}
                      style={{ background: option.swatch }}
                      onClick={() => {
                        setSpectrumGradientForPreset(activeSpectrumPreset.id, option.id);
                      }}
                    />
                  ))}
                </div>
              </div>
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
          </div>
        ) : (
          <div ref={lookPanelRef} className={styles.settingsSection} aria-label="Bar visualizer look">
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
            {playback.visualizerPrefs.enabled ? (
              <div className={styles.panelSection}>
                <h2 className={styles.panelSection__title}>Bar layout</h2>
                <div className={styles.segments} role="group" aria-label="Control bar visualizer layout">
                  {(
                    [
                      { value: 'backdrop', label: 'Full background' },
                      { value: 'inline', label: 'Inline strip' },
                    ] as const satisfies { value: BarVisualizerDockLayoutMode; label: string }[]
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.segment} no-glass`}
                      aria-pressed={dockLayoutMode === option.value}
                      onClick={() => {
                        handle.setVisualizerPreferences({ dockLayoutMode: option.value });
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
            ) : null}
            {playback.visualizerPrefs.enabled && dockLayoutMode === 'backdrop' ? (
              <div className={styles.panelSection}>
                <h2 className={styles.panelSection__title}>Opacity</h2>
                <div className={styles.opacityControl}>
                  <input
                    type="range"
                    className={`${styles.opacityControl__slider} no-glass`}
                    min={DOCK_OPACITY_RANGE.min}
                    max={DOCK_OPACITY_RANGE.max}
                    step={DOCK_OPACITY_RANGE.step}
                    value={dockVisualizerOpacity}
                    aria-label="Control bar visualizer opacity"
                    aria-valuemin={Math.round(DOCK_OPACITY_RANGE.min * 100)}
                    aria-valuemax={Math.round(DOCK_OPACITY_RANGE.max * 100)}
                    aria-valuenow={dockVisualizerOpacityPct}
                    aria-valuetext={`${dockVisualizerOpacityPct} percent`}
                    onChange={(event) => {
                      handle.setVisualizerPreferences({ dockOpacity: Number(event.target.value) });
                      setPlayback((current) =>
                        current
                          ? { ...current, visualizerPrefs: handle.getVisualizerPreferences() }
                          : current
                      );
                    }}
                  />
                  <span className={styles.opacityControl__pct} aria-hidden="true">
                    {dockVisualizerOpacityPct}
                  </span>
                </div>
              </div>
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
          </div>
        )}
          </div>
        </section>
      ) : null}

      <div ref={rowRef} className={styles.row} data-meta-resizing={isMetaResizing ? 'true' : 'false'}>
        {showDockVizBackdrop ? (
          <div
            ref={canvasHostRef}
            className={styles.vizBackdrop}
            data-irp-dock-viz-backdrop="true"
            style={{ opacity: dockVisualizerOpacity }}
            aria-hidden="true"
          />
        ) : null}

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
            <span
              className={styles.play__glyph}
              data-state={playback.isPlaying ? 'pause' : 'play'}
              aria-hidden="true"
            />
          </button>

          <div className={styles.transport} aria-label="Station transport">
            <button
              type="button"
              className={`${styles.transportBtn} no-glass`}
              aria-label="Previous station"
              title="Previous station"
              disabled={!canSkipStations}
              data-testid="radio-previous-station"
              onClick={() => {
                skipStation('previous');
              }}
            >
              <SiteIcon id="arrowLeft" sizeRem={0.85} title="" />
            </button>
            <button
              type="button"
              className={`${styles.transportBtn} no-glass`}
              aria-label="Next station"
              title="Next station"
              disabled={!canSkipStations}
              data-testid="radio-next-station"
              onClick={() => {
                skipStation('next');
              }}
            >
              <SiteIcon id="arrowRight" sizeRem={0.85} title="" />
            </button>
          </div>

          <div
            ref={metaBlockRef}
            className={styles.metaBlock}
            data-custom-width={metaWidthPx !== null && !useExpandedMetaLayout ? 'true' : 'false'}
            style={
              metaWidthPx !== null && !useExpandedMetaLayout
                ? {
                  width: `${metaWidthPx}px`,
                  flex: '0 0 auto',
                }
                : undefined
            }
          >
            <div className={styles.meta}>
              <div className={styles.metaStationRow}>
                <button
                  type="button"
                  className={`${styles.metaStationFavorite} no-glass`}
                  aria-pressed={isCurrentStationFavorite}
                  aria-label={
                    isCurrentStationFavorite
                      ? `Remove ${playback.stationName} from favorites`
                      : `Add ${playback.stationName} to favorites`
                  }
                  title={
                    isCurrentStationFavorite
                      ? `Remove ${playback.stationName} from favorites`
                      : `Add ${playback.stationName} to favorites`
                  }
                  data-testid="radio-favorite-current-station"
                  onClick={(event) => {
                    event.stopPropagation();
                    void toggleFavorite(playback.stationName);
                  }}
                >
                  <SiteIcon id="star" sizeRem={0.85} title="" />
                </button>
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
              </div>
              {hasReportedTrack && playback.trackDisplay ? (
                <div className={styles.trackRow}>
                  <RadioPlayerTrackSearchButton
                    handle={handle}
                    trackDisplay={playback.trackDisplay}
                  />
                  <RadioPlayerTrackTitleTip
                    trackDisplay={playback.trackDisplay}
                    className={styles.subtitle}
                  />
                </div>
              ) : subtitle ? (
                <RadioPlayerOverflowText
                  text={subtitle}
                  className={styles.subtitle}
                  as="p"
                />
              ) : null}
            </div>
            {!useExpandedMetaLayout ? (
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

        {showDockVizInline ? (
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

          <button
            type="button"
            className={`${styles.toolIconBtn} no-glass`}
            aria-pressed={activePanel === 'settings'}
            aria-label="Player settings"
            title="Player settings"
            data-testid="radio-settings-trigger"
            onClick={() => {
              togglePanel('settings');
            }}
          >
            <SiteIcon id="settings" sizeRem={0.9} title="" />
          </button>

          <div className={styles.toolsBpm}>
            <RadioPlayerBpmDisplay isPlaying={playback.isPlaying} />
          </div>

          {isStandalonePwa() ? (
            <button
              type="button"
              className={`${styles.toolIconBtn} no-glass`}
              aria-pressed={isFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              data-testid="radio-pwa-document-fullscreen-trigger"
              onClick={() => {
                void toggleDocumentFullscreen();
              }}
            >
              <SiteIcon id={isFullscreen ? 'close' : 'maximize'} sizeRem={0.9} title="" />
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.toolIconBtn} no-glass`}
              aria-pressed={isActive}
              aria-label={isActive ? 'Exit fullscreen visualizer' : 'Open fullscreen visualizer'}
              title={isActive ? 'Exit fullscreen visualizer' : 'Open fullscreen visualizer'}
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
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
