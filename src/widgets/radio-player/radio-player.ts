/**
 * IDLING RADIO PLAYER — embed on any site
 * =======================================
 *
 * In idling.app: mounted via RadioPlayerMount (src/app/components/radio-player).
 *
 * External embed (modular):
 *   <link rel="stylesheet" href="/widgets/radio-player/radio-player.css">
 *   <div id="my-radio"></div>
 *   <script type="module">
 *     import { mountRadioPlayer } from '/widgets/radio-player/radio-player.js';
 *     mountRadioPlayer(document.getElementById('my-radio'));
 *   </script>
 */

import type { BarVisualizerDensity, BarVisualizerPreferences } from './barVisualizer.types';
import {
  BAR_COUNT_BY_DENSITY,
  clampScopeSmoothing,
  clampDockOpacity,
  normalizeDockLayoutMode,
  DEFAULT_BAR_VISUALIZER_PREFERENCES,
  loadBarVisualizerPreferences,
  resolveBarCountForCanvas,
  resolveBarGapForDensity,
  resolveBarVisualizerPresetForSurface,
  saveBarVisualizerPreferences,
  SCOPE_SMOOTHING_RANGE,
} from './barVisualizerPreferences';
import {
  BAR_VISUALIZER_PRESET_DEFINITIONS,
  createBarVisualizerRuntime,
  getBarVisualizerPresetDefinition,
  isBarVisualizerFullscreenOnly,
  isBarVisualizerDockOnly,
  isScopeVisualizerPreset,
  listBarVisualizerPresetsForSurface,
  normalizeBarVisualizerPresetId,
} from './barVisualizerPresets';
import {
  createCanvasVisualizerTimeDomainBuffer,
  sampleCanvasVisualizerTimeDomain,
} from './canvasVisualizerTimeDomain';
import {
  AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
  createAudioStreamTempoState,
  tickAudioStreamTempo,
} from './audioStreamTempo';
import { createRadioEqualizerChain } from './radioEqualizer';
import {
  createDefaultRadioEqualizerSettings,
  getRadioEqualizerPreset,
  normalizeRadioEqualizerBandGains,
} from './radioEqualizerPresets';
import {
  createRadioEqualizerLastSelectionFromCustom,
  createRadioEqualizerLastSelectionFromPreset,
} from './radioEqualizerLastSelection';
import {
  deleteRadioEqualizerCustomPresetEntry,
  isRadioEqualizerCustomPresetSaved,
  normalizeRadioEqualizerCustomPresetLabel,
} from './radioEqualizerCustomPresets';
import {
  loadRadioEqualizerSettings,
  saveRadioEqualizerSettings,
} from './radioEqualizerPersistence';
import type { RadioEqualizerChain, RadioEqualizerCustomSlot, RadioEqualizerPresetId, RadioEqualizerSettings } from './radioEqualizer.types';
import { getBarVisualizerTheme } from './barVisualizerThemes';
import { attachRadioHlsPlayback } from './radioHlsPlayback';
import type {
  RadioNowPlayingInfo,
  RadioPlayerHandle,
  RadioPlayerOptions,
  RadioStationCatalog,
} from './radioPlayer.types';
import type { IrpDropdownConfig, IrpDropdownHandle, RadioNowPlayingApiResponse, WindowWithWebkitAudioContext } from './radioPlayerEngine.types';
import { RADIO_STATIONS as CATALOG_STATIONS } from './radioStationCatalog';
import {
  clearRuntimeStationDefinitions,
  rememberTrackMetadataUnsupported,
  setRuntimeStationDefinitions,
  stationSupportsTrackMetadata,
} from './radioStationMetadata';
import type { RadioHlsPlaybackHandle } from './radioStreamProbe.types';
import { resolveRadioStreamUrl } from './resolveRadioStreamUrl';
import { createSpectrumNormalizer } from './spectrumNormalization';

export const RADIO_STATIONS: RadioStationCatalog = CATALOG_STATIONS;

export const RADIO_PLAYER_STORAGE_KEY = 'idling-radio-player-station';

const ANALYSER_FFT_SIZE = 2048;
const NOW_PLAYING_POLL_MS = 20000;

const PLAY_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>`;
const CHEVRON_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m6 9 6 6 6-6"/></svg>`;
const BARS_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M4 10h3v10H4V10zm6.5-4h3v14h-3V6zm7 6h3v8h-3v-8z"/></svg>`;
const IRP_NO_GLASS_CLASS = 'no-glass';

const DENSITY_LABELS: Record<BarVisualizerDensity, string> = {
  compact: 'Compact',
  normal: 'Normal',
  wide: 'Wide',
};

function createIrpDropdown(config: IrpDropdownConfig): IrpDropdownHandle {
  const portaled = { value: false };

  const position = () => {
    if (config.panel.hidden) {
      return;
    }

    const triggerRect = config.trigger.getBoundingClientRect();
    const popoverWidth = config.widthForTrigger(triggerRect);
    const insetRight = Math.max(8, window.innerWidth - triggerRect.right);
    const bottomOffset = Math.max(8, window.innerHeight - triggerRect.top + 8);

    config.panel.style.width = `${popoverWidth}px`;
    config.panel.style.right = `${insetRight}px`;
    config.panel.style.bottom = `${bottomOffset}px`;
  };

  const setOpen = (open: boolean) => {
    config.panel.hidden = !open;
    config.trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    config.shell.classList.toggle(config.openShellClass, open);

    if (open) {
      if (config.panel.parentElement !== document.body) {
        document.body.appendChild(config.panel);
        portaled.value = true;
      }
      position();
      window.requestAnimationFrame(position);
      return;
    }

    if (portaled.value && config.panel.parentElement === document.body) {
      config.anchor.appendChild(config.panel);
      portaled.value = false;
    }
  };

  const reparent = () => {
    if (portaled.value && config.panel.parentElement === document.body) {
      config.anchor.appendChild(config.panel);
      portaled.value = false;
    }
  };

  return {
    panel: config.panel,
    trigger: config.trigger,
    anchor: config.anchor,
    setOpen,
    position,
    reparent,
  };
}

function attachVolumeControl(
  block: HTMLElement,
  input: HTMLInputElement,
  getVolume: () => number,
  setVolumeLevel: (level: number) => void
): () => void {
  const valueEl = block.querySelector('.irp__volume-value');

  const sync = () => {
    const level = getVolume();
    input.value = String(level);
    const pct = Math.round(level * 100);
    block.setAttribute('data-volume', String(pct));
    if (valueEl) {
      valueEl.textContent = `${pct}%`;
    }
  };

  input.addEventListener('input', () => {
    setVolumeLevel(Number(input.value));
    sync();
  });

  block.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const step = event.shiftKey ? 0.01 : 0.05;
      const direction = event.deltaY < 0 ? 1 : -1;
      setVolumeLevel(getVolume() + step * direction);
      sync();
    },
    { passive: false }
  );

  sync();
  return sync;
}

export function mountRadioPlayer(mountNode: ParentNode, options: RadioPlayerOptions = {}): RadioPlayerHandle {
  const stations = options.stations ?? RADIO_STATIONS;
  const storageKey = options.storageKey ?? RADIO_PLAYER_STORAGE_KEY;
  const nowPlayingEndpoint = options.nowPlayingEndpoint ?? '/api/radio/now-playing';
  const headless = options.headless === true;

  if (options.stationDefinitions?.length) {
    setRuntimeStationDefinitions(options.stationDefinitions);
  } else {
    clearRuntimeStationDefinitions();
  }

  const stationNames = Object.keys(stations);
  const saved = localStorage.getItem(storageKey);
  let activeName = saved && stations[saved] ? saved : stationNames[0];

  let visualizerPrefs: BarVisualizerPreferences = loadBarVisualizerPreferences();
  let barCount = BAR_COUNT_BY_DENSITY[visualizerPrefs.density] ?? BAR_COUNT_BY_DENSITY.normal;

  const root = document.createElement('div');
  root.className = headless ? 'irp irp--headless' : 'irp';
  root.innerHTML = headless
    ? `
    <canvas class="irp__viz" aria-hidden="true"></canvas>
    <div class="irp__tap" hidden>
      <button type="button" class="irp__tap-btn no-glass">Tap to start radio</button>
    </div>`
    : `
    <div class="irp__shell">
      <div class="irp__tap" hidden>
        <button type="button" class="irp__tap-btn no-glass">Tap to start radio</button>
      </div>
      <div class="irp__panel">
        <section class="irp__deck irp__deck--playback">
          <button type="button" class="irp__play no-glass" aria-label="Play">
            <span class="irp__play-icon irp__play-icon--play">${PLAY_ICON}</span>
            <span class="irp__play-icon irp__play-icon--pause">${PAUSE_ICON}</span>
          </button>
          <canvas class="irp__viz" aria-hidden="true"></canvas>
          <div class="irp__identity">
            <p class="irp__track" aria-live="polite"></p>
            <p class="irp__station-line"></p>
          </div>
        </section>
        <section class="irp__deck irp__deck--controls">
          <div class="irp__volume-block" tabindex="0" aria-label="Volume — scroll to adjust">
            <div class="irp__volume-head">
              <span class="irp__volume-label">Volume</span>
              <span class="irp__volume-value">85%</span>
            </div>
            <input class="irp__volume" id="irp-volume" type="range" min="0" max="1" step="0.01" value="0.85" aria-label="Volume" />
          </div>
          <div class="irp__picker-anchor irp__picker-anchor--station">
            <button
              type="button"
              class="irp__picker-trigger irp__station-trigger no-glass"
              aria-haspopup="listbox"
              aria-expanded="false"
              title="Choose a radio station"
            >
              <span class="irp__picker-trigger-label irp__station-trigger-label">Stations</span>
              <span class="irp__picker-trigger-chevron" aria-hidden="true">${CHEVRON_ICON}</span>
            </button>
            <div class="irp__picker-popover irp__station-popover" hidden role="listbox" aria-label="Radio stations">
              <div class="irp__picker-list irp__station-list"></div>
            </div>
          </div>
          <div class="irp__picker-anchor irp__picker-anchor--look">
            <button
              type="button"
              class="irp__picker-trigger irp__look-trigger no-glass"
              aria-haspopup="dialog"
              aria-expanded="false"
              title="Visualizer appearance"
            >
              <span class="irp__look-trigger-icon" aria-hidden="true">${BARS_ICON}</span>
              <span class="irp__picker-trigger-label irp__look-trigger-label">Look</span>
              <span class="irp__picker-trigger-chevron" aria-hidden="true">${CHEVRON_ICON}</span>
            </button>
            <div class="irp__picker-popover irp__look-popover" hidden role="dialog" aria-label="Visualizer settings">
              <div class="irp__look-panel">
                <section class="irp__look-section">
                  <h3 class="irp__look-heading">Style</h3>
                  <div class="irp__picker-list irp__look-style-list" role="listbox" aria-label="Visualizer styles"></div>
                </section>
                <section class="irp__look-section">
                  <h3 class="irp__look-heading">Bar spacing</h3>
                  <div class="irp__look-density" role="radiogroup" aria-label="Bar spacing">
                    <button type="button" class="irp__look-density-btn no-glass" data-density="compact" role="radio" aria-checked="false">Compact</button>
                    <button type="button" class="irp__look-density-btn no-glass" data-density="normal" role="radio" aria-checked="false">Normal</button>
                    <button type="button" class="irp__look-density-btn no-glass" data-density="wide" role="radio" aria-checked="false">Wide</button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
        <p class="irp__label"></p>
      </div>
    </div>`;
  mountNode.appendChild(root);

  const canvasParkingHost = document.createElement('div');
  canvasParkingHost.setAttribute('data-irp-canvas-park', 'true');
  canvasParkingHost.setAttribute('aria-hidden', 'true');
  root.appendChild(canvasParkingHost);

  const shell = headless ? null : (root.querySelector('.irp__shell') as HTMLElement);
  const tap = root.querySelector('.irp__tap') as HTMLElement;
  const tapBtn = root.querySelector('.irp__tap-btn') as HTMLButtonElement;
  const canvas = root.querySelector('.irp__viz') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  const stationAnchor = headless
    ? null
    : (root.querySelector('.irp__picker-anchor--station') as HTMLElement);
  const stationTrigger = headless
    ? null
    : (root.querySelector('.irp__station-trigger') as HTMLButtonElement);
  const stationPanel = headless
    ? null
    : (root.querySelector('.irp__station-popover') as HTMLElement);
  const stationList = headless
    ? null
    : (root.querySelector('.irp__station-list') as HTMLElement);
  const lookAnchor = headless
    ? null
    : (root.querySelector('.irp__picker-anchor--look') as HTMLElement);
  const lookTrigger = headless
    ? null
    : (root.querySelector('.irp__look-trigger') as HTMLButtonElement);
  const lookPanel = headless
    ? null
    : (root.querySelector('.irp__look-popover') as HTMLElement);
  const styleList = headless
    ? null
    : (root.querySelector('.irp__look-style-list') as HTMLElement);
  const densityButtons = headless
    ? ([] as unknown as NodeListOf<HTMLButtonElement>)
    : root.querySelectorAll<HTMLButtonElement>('.irp__look-density-btn');
  const volumeBlock = headless
    ? null
    : (root.querySelector('.irp__volume-block') as HTMLElement);
  const volume = headless ? null : (root.querySelector('.irp__volume') as HTMLInputElement);
  const playBtn = headless ? null : (root.querySelector('.irp__play') as HTMLButtonElement);
  const meta = headless ? null : (root.querySelector('.irp__identity') as HTMLElement);
  const track = headless ? null : (root.querySelector('.irp__track') as HTMLElement);
  const stationLine = headless ? null : (root.querySelector('.irp__station-line') as HTMLElement);
  const label = headless ? null : (root.querySelector('.irp__label') as HTMLElement);

  if (!ctx) {
    throw new Error('Radio player canvas context unavailable');
  }

  const audio = new Audio();
  audio.preload = 'none';

  let stationLoadToken = 0;
  let suppressStreamReconnect = false;
  audio.crossOrigin = 'anonymous';
  audio.preload = 'none';

  let syncVolumeUi: (() => void) | null = null;

  const clampVolume = (level: number): number => Math.min(1, Math.max(0, level));

  const setVolumeLevel = (level: number): void => {
    audio.volume = clampVolume(level);
    syncVolumeUi?.();
  };

  syncVolumeUi = headless
    ? null
    : attachVolumeControl(volumeBlock!, volume!, () => audio.volume, setVolumeLevel);

  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaElementAudioSourceNode | null = null;
  let equalizerChain: RadioEqualizerChain | null = null;
  let equalizerSettings: RadioEqualizerSettings = createDefaultRadioEqualizerSettings();

  const applyEqualizerToChain = (): void => {
    equalizerChain?.setBandGains(equalizerSettings.bandGains);
  };

  void loadRadioEqualizerSettings().then((settings) => {
    equalizerSettings = settings;
    applyEqualizerToChain();
  });
  let rafId = 0;
  let vizLoopActive = false;
  let tempoRafId = 0;
  let tempoState = createAudioStreamTempoState();
  let lastTempoTickMs = 0;
  let lastTempoDeltaSeconds = 1 / 60;
  let tempoUniforms = AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS;

  const resetTempoAnalysis = (): void => {
    tempoState = createAudioStreamTempoState();
    lastTempoTickMs = 0;
    lastTempoDeltaSeconds = 1 / 60;
    tempoUniforms = AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS;
  };

  const advanceTempoAnalysis = (frequencyData: Uint8Array): number => {
    if (!analyser || !playing) {
      return lastTempoDeltaSeconds;
    }

    const nowMs = performance.now();
    const deltaSeconds =
      lastTempoTickMs > 0 ? Math.min(0.05, (nowMs - lastTempoTickMs) / 1000) : 0;
    lastTempoTickMs = nowMs;
    lastTempoDeltaSeconds = deltaSeconds || 1 / 60;
    const tempoTick = tickAudioStreamTempo({
      frequencyData,
      timestampMs: nowMs,
      state: tempoState,
      deltaSeconds,
    });
    tempoState = tempoTick.state;
    tempoUniforms = tempoTick.uniforms;
    return lastTempoDeltaSeconds;
  };

  let playing = false;
  let needsTap = true;
  let rawFreq = new Uint8Array(ANALYSER_FFT_SIZE / 2);
  let rawTime = new Uint8Array(ANALYSER_FFT_SIZE);
  let timeWave = createCanvasVisualizerTimeDomainBuffer(ANALYSER_FFT_SIZE);
  let smoothedTimeWave = createCanvasVisualizerTimeDomainBuffer(ANALYSER_FFT_SIZE);
  let spectrumNormalizer = createSpectrumNormalizer(barCount);
  let visualizerRuntime = createBarVisualizerRuntime(visualizerPrefs.presetId, barCount);
  let nowPlaying: RadioNowPlayingInfo = {
    streamTitle: null,
    artist: null,
    title: null,
    display: null,
  };
  let nowPlayingPollTimer = 0;
  let streamPlaybackHandle: RadioHlsPlaybackHandle | null = null;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const syncStationName = () => {
    if (headless || !stationLine || !stationTrigger || !stationList) {
      return;
    }
    stationLine.textContent = activeName;
    stationLine.setAttribute('title', activeName);
    stationTrigger.setAttribute('title', `Change station — now on ${activeName}`);
    stationTrigger.setAttribute('aria-label', `Change radio station. Now playing ${activeName}`);

    stationList.querySelectorAll('.irp__station-option').forEach((node) => {
      const option = node as HTMLButtonElement;
      const selected = option.dataset.stationName === activeName;
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  };

  const setTrackDisplay = () => {
    if (headless || !track) {
      return;
    }
    const text =
      nowPlaying.display && stationSupportsTrackMetadata(activeName) ? nowPlaying.display : null;
    if (text) {
      track.textContent = text;
      track.removeAttribute('data-empty');
      track.setAttribute('title', text);
      return;
    }

    track.textContent = playing ? 'Listening…' : 'Select play to start';
    track.setAttribute('data-empty', 'true');
    track.removeAttribute('title');
  };

  const setLabel = () => {
    if (headless || !label) {
      return;
    }
    const trackPart =
      nowPlaying.display && stationSupportsTrackMetadata(activeName)
        ? ` · ${nowPlaying.display}`
        : '';
    label.textContent = playing ? `Now playing · ${activeName}${trackPart}` : activeName;
  };

  const syncNowPlayingUi = () => {
    syncStationName();
    setTrackDisplay();
    setLabel();
  };

  const applyVisualizerThemeToRoot = () => {
    const theme = getBarVisualizerTheme();
    root.dataset.irpTheme = theme.id;
    root.dataset.irpPreset = visualizerPrefs.presetId;
    root.style.setProperty('--irp-accent', `rgb(${theme.primary.r} ${theme.primary.g} ${theme.primary.b})`);
    root.style.setProperty(
      '--irp-accent-secondary',
      `rgb(${theme.secondary.r} ${theme.secondary.g} ${theme.secondary.b})`
    );
    root.style.setProperty('--irp-glow', theme.glow);
  };

  let dropdowns: IrpDropdownHandle[] = [];
  let syncVisualizerControlsUi: (() => void) | null = null;
  let uiCleanup: () => void = () => { };

  if (!headless && shell && stationAnchor && stationPanel && stationTrigger && lookAnchor && lookPanel && lookTrigger && styleList && stationList) {
    stationNames.forEach((name) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = `irp__picker-option irp__station-option ${IRP_NO_GLASS_CLASS}`;
      option.dataset.stationName = name;
      option.setAttribute('role', 'option');
      option.textContent = name;
      option.addEventListener('click', () => {
        loadStation(name, playing);
        stationDropdown.setOpen(false);
      });
      stationList.appendChild(option);
    });

    const stationDropdown = createIrpDropdown({
      shell,
      anchor: stationAnchor,
      panel: stationPanel,
      trigger: stationTrigger,
      openShellClass: 'irp__shell--station-open',
      widthForTrigger: (triggerRect) => Math.min(320, Math.max(260, triggerRect.width + 64)),
    });

    const lookDropdown = createIrpDropdown({
      shell,
      anchor: lookAnchor,
      panel: lookPanel,
      trigger: lookTrigger,
      openShellClass: 'irp__shell--look-open',
      widthForTrigger: () => 320,
    });

    dropdowns = [stationDropdown, lookDropdown];

    const toggleDropdown = (dropdown: IrpDropdownHandle) => {
      const willOpen = dropdown.panel.hasAttribute('hidden');
      dropdowns.forEach((entry) => entry.setOpen(entry === dropdown ? willOpen : false));
    };

    const positionOpenPopovers = () => {
      dropdowns.forEach((dropdown) => dropdown.position());
    };

    syncVisualizerControlsUi = () => {
      const preset = getBarVisualizerPresetDefinition(visualizerPrefs.dockPresetId);
      const densityLabel = DENSITY_LABELS[visualizerPrefs.density] ?? DENSITY_LABELS.normal;

      lookTrigger.setAttribute('title', `${preset.label} style · ${densityLabel} spacing`);
      lookTrigger.setAttribute(
        'aria-label',
        `Visualizer settings. ${preset.label} style, ${densityLabel} bar spacing.`
      );

      styleList.querySelectorAll('.irp__look-style-option').forEach((node) => {
        const option = node as HTMLButtonElement;
        const selected = option.dataset.presetId === visualizerPrefs.dockPresetId;
        option.setAttribute('aria-selected', selected ? 'true' : 'false');
      });

      densityButtons.forEach((button) => {
        const selected = button.dataset.density === visualizerPrefs.density;
        button.setAttribute('aria-checked', selected ? 'true' : 'false');
      });
    };

    const buildVisualizerControls = () => {
      styleList.replaceChildren();
      listBarVisualizerPresetsForSurface('dock').forEach((preset) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = `irp__picker-option irp__look-style-option ${IRP_NO_GLASS_CLASS}`;
        option.dataset.presetId = preset.id;
        option.setAttribute('role', 'option');
        option.title = preset.description;
        option.textContent = preset.label;
        option.addEventListener('click', () => {
          setVisualizerPreferences({ presetId: preset.id, dockPresetId: preset.id });
        });
        styleList.appendChild(option);
      });

      densityButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const density = button.dataset.density;
          if (density === 'compact' || density === 'normal' || density === 'wide') {
            setVisualizerPreferences({ density });
          }
        });
      });

      syncVisualizerControlsUi?.();
    };

    const onPopoverPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      for (const dropdown of dropdowns) {
        if (dropdown.panel.hidden) {
          continue;
        }

        if (!target || (!dropdown.panel.contains(target) && !dropdown.trigger.contains(target))) {
          dropdown.setOpen(false);
        }
      }
    };

    const onPopoverKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      const openDropdown = dropdowns.find((dropdown) => !dropdown.panel.hidden);
      if (!openDropdown) {
        return;
      }

      event.preventDefault();
      openDropdown.setOpen(false);
      openDropdown.trigger.focus();
    };

    buildVisualizerControls();

    playBtn?.addEventListener('click', () => {
      if (playing) pause();
      else void play();
    });

    stationTrigger.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleDropdown(stationDropdown);
    });

    lookTrigger.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleDropdown(lookDropdown);
    });

    document.addEventListener('pointerdown', onPopoverPointerDown);
    document.addEventListener('keydown', onPopoverKeyDown);
    window.addEventListener('resize', positionOpenPopovers);
    window.addEventListener('scroll', positionOpenPopovers, true);

    if (volume) {
      setVolumeLevel(Number(volume.value));
    }

    let barHeightObserver: ResizeObserver | null = null;

    const syncBarHeight = () => {
      const heightPx = Math.ceil(shell.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--irp-bar-height', `${heightPx}px`);
    };

    if (typeof ResizeObserver !== 'undefined') {
      barHeightObserver = new ResizeObserver(syncBarHeight);
      barHeightObserver.observe(shell);
      syncBarHeight();
    }

    uiCleanup = () => {
      document.removeEventListener('pointerdown', onPopoverPointerDown);
      document.removeEventListener('keydown', onPopoverKeyDown);
      window.removeEventListener('resize', positionOpenPopovers);
      window.removeEventListener('scroll', positionOpenPopovers, true);
      dropdowns.forEach((dropdown) => dropdown.reparent());
      barHeightObserver?.disconnect();
      document.documentElement.style.removeProperty('--irp-bar-height');
    };
  } else {
    audio.volume = 0.85;
  }

  const rebuildVisualizer = (): void => {
    const host = canvas.parentElement;
    const layoutWidth = host?.clientWidth ?? canvas.getBoundingClientRect().width;
    const activePresetId = resolveBarVisualizerPresetForSurface(
      visualizerPrefs,
      canvas.closest('[data-irp-bar-fullscreen="true"]') !== null ? 'expanded' : 'dock'
    );

    barCount = resolveBarCountForCanvas({
      density: visualizerPrefs.density,
      canvasWidthPx: layoutWidth,
      presetId: activePresetId,
    });
    spectrumNormalizer = createSpectrumNormalizer(barCount);
    visualizerRuntime = createBarVisualizerRuntime(activePresetId, barCount);
    applyVisualizerThemeToRoot();
    syncVisualizerControlsUi?.();
    saveBarVisualizerPreferences(visualizerPrefs);
    syncVisualizerLoop();
  };

  const syncBarCountForCanvas = (layoutWidthPx?: number): void => {
    const host = canvas.parentElement;
    const measuredWidth =
      layoutWidthPx ??
      host?.clientWidth ??
      canvas.getBoundingClientRect().width ??
      canvas.clientWidth;
    const activePresetId = resolveBarVisualizerPresetForSurface(
      visualizerPrefs,
      canvas.closest('[data-irp-bar-fullscreen="true"]') !== null ? 'expanded' : 'dock'
    );

    const nextCount = resolveBarCountForCanvas({
      density: visualizerPrefs.density,
      canvasWidthPx: measuredWidth,
      presetId: activePresetId,
    });

    if (nextCount === barCount) {
      return;
    }

    barCount = nextCount;
    spectrumNormalizer = createSpectrumNormalizer(barCount);
    visualizerRuntime.resize(barCount);

    if (!playing) {
      paintIdleVisualizerFrame();
    }
  };

  const setVisualizerPreferences = (nextPrefs: Partial<BarVisualizerPreferences>): void => {
    const incomingPreset =
      nextPrefs.presetId !== undefined
        ? normalizeBarVisualizerPresetId(nextPrefs.presetId)
        : visualizerPrefs.presetId;
    const presetIsExpandedOnly = isBarVisualizerFullscreenOnly(incomingPreset);
    const presetIsDockOnly = isBarVisualizerDockOnly(incomingPreset);

    visualizerPrefs = {
      presetId:
        nextPrefs.presetId !== undefined && !presetIsDockOnly
          ? incomingPreset
          : visualizerPrefs.presetId,
      dockPresetId:
        nextPrefs.dockPresetId !== undefined
          ? resolveBarVisualizerPresetForSurface(
              {
                ...visualizerPrefs,
                dockPresetId: nextPrefs.dockPresetId,
              },
              'dock'
            )
          : presetIsExpandedOnly || presetIsDockOnly
            ? visualizerPrefs.dockPresetId
            : incomingPreset,
      density: nextPrefs.density ?? visualizerPrefs.density,
      enabled: nextPrefs.enabled ?? visualizerPrefs.enabled,
      waveStyle: nextPrefs.waveStyle ?? visualizerPrefs.waveStyle,
      colorPalette: nextPrefs.colorPalette ?? visualizerPrefs.colorPalette,
      barFill: nextPrefs.barFill ?? visualizerPrefs.barFill,
      barTrail: nextPrefs.barTrail ?? visualizerPrefs.barTrail,
      glow: nextPrefs.glow ?? visualizerPrefs.glow,
      scopeSmoothing:
        nextPrefs.scopeSmoothing !== undefined
          ? clampScopeSmoothing(nextPrefs.scopeSmoothing)
          : visualizerPrefs.scopeSmoothing,
      dockOpacity:
        nextPrefs.dockOpacity !== undefined
          ? clampDockOpacity(nextPrefs.dockOpacity)
          : visualizerPrefs.dockOpacity,
      dockLayoutMode:
        nextPrefs.dockLayoutMode !== undefined
          ? normalizeDockLayoutMode(nextPrefs.dockLayoutMode)
          : visualizerPrefs.dockLayoutMode,
    };
    rebuildVisualizer();
  };

  const getBarDrawContextBase = () => {
    const isFullscreen = canvas.closest('[data-irp-bar-fullscreen="true"]') !== null;
    const dockBackdrop =
      !isFullscreen &&
      canvas.parentElement?.getAttribute('data-irp-dock-viz-backdrop') === 'true';

    return {
      barGap: resolveBarGapForDensity(visualizerPrefs.density),
      theme: getBarVisualizerTheme(),
      state: visualizerRuntime.getState(),
      fullscreen: isFullscreen,
      dockBackdrop,
      waveStyle: visualizerPrefs.waveStyle ?? 'line',
      colorPalette: visualizerPrefs.colorPalette ?? 'theme',
      timeData: timeWave,
      barFill: visualizerPrefs.barFill ?? 'solid',
      barTrail: visualizerPrefs.barTrail ?? 'none',
      glow: visualizerPrefs.glow ?? 'off',
    };
  };

  const fetchNowPlaying = async () => {
    if (!playing || !stationSupportsTrackMetadata(activeName)) {
      return;
    }

    const stationAtFetch = activeName;

    try {
      const response = await fetch(
        `${nowPlayingEndpoint}?station=${encodeURIComponent(stationAtFetch)}`,
        {
          headers: {
            'X-Background-Request': 'true',
          },
        }
      );
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as RadioNowPlayingApiResponse;
      if (activeName !== stationAtFetch || data.station !== stationAtFetch || !playing) {
        return;
      }

      if (data.supportsTrackMetadata === false) {
        rememberTrackMetadataUnsupported(stationAtFetch);
        stopNowPlayingPoll();
        resetNowPlaying();
        return;
      }

      nowPlaying = {
        streamTitle: data.streamTitle ?? null,
        artist: data.artist ?? null,
        title: data.title ?? null,
        display: data.display ?? null,
      };
      syncNowPlayingUi();
    } catch {
      /* metadata is best-effort */
    }
  };

  const stopNowPlayingPoll = () => {
    if (nowPlayingPollTimer) {
      window.clearInterval(nowPlayingPollTimer);
      nowPlayingPollTimer = 0;
    }
  };

  const startNowPlayingPoll = () => {
    stopNowPlayingPoll();

    if (!stationSupportsTrackMetadata(activeName)) {
      syncNowPlayingUi();
      return;
    }

    void fetchNowPlaying();
    nowPlayingPollTimer = window.setInterval(() => {
      void fetchNowPlaying();
    }, NOW_PLAYING_POLL_MS);
  };

  const resetNowPlaying = () => {
    nowPlaying = {
      streamTitle: null,
      artist: null,
      title: null,
      display: null,
    };
    syncNowPlayingUi();
  };

  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const host = canvas.parentElement;
    const layoutWidth = Math.max(1, host?.clientWidth ?? canvas.getBoundingClientRect().width);
    const layoutHeight = Math.max(1, host?.clientHeight ?? canvas.getBoundingClientRect().height);

    canvas.width = Math.max(1, Math.floor(layoutWidth * dpr));
    canvas.height = Math.max(1, Math.floor(layoutHeight * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    syncBarCountForCanvas(layoutWidth);
  };

  const ensureAudioGraph = async (): Promise<void> => {
    if (!audioCtx) {
      const browserWindow = window as WindowWithWebkitAudioContext;
      const Ctx = window.AudioContext ?? browserWindow.webkitAudioContext;
      if (!Ctx) {
        return;
      }
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    if (!source && audioCtx) {
      try {
        source = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = ANALYSER_FFT_SIZE;
        analyser.smoothingTimeConstant = 0.72;
        analyser.minDecibels = -88;
        analyser.maxDecibels = -22;
        if (!equalizerChain) {
          equalizerChain = createRadioEqualizerChain(audioCtx);
          applyEqualizerToChain();
        }
        source.connect(equalizerChain.input);
        equalizerChain.output.connect(analyser);
        analyser.connect(audioCtx.destination);
        rawFreq = new Uint8Array(analyser.frequencyBinCount);
        rawTime = new Uint8Array(analyser.fftSize);
        timeWave = createCanvasVisualizerTimeDomainBuffer(analyser.fftSize);
        smoothedTimeWave = createCanvasVisualizerTimeDomainBuffer(analyser.fftSize);
      } catch {
        analyser = null;
      }
    }
  };

  const shouldAnimateBarVisualizer = () =>
    visualizerPrefs.enabled &&
    playing &&
    !prefersReducedMotion &&
    document.visibilityState === 'visible' &&
    canvas.isConnected;

  const shouldRunTempoLoop = () =>
    playing && analyser !== null && document.visibilityState === 'visible';

  const tickTempoLoop = () => {
    if (!shouldRunTempoLoop()) {
      tempoRafId = 0;
      return;
    }

    if (!shouldAnimateBarVisualizer() && analyser) {
      analyser.getByteFrequencyData(rawFreq);
      advanceTempoAnalysis(rawFreq);
    }

    tempoRafId = requestAnimationFrame(tickTempoLoop);
  };

  const syncTempoLoop = () => {
    if (shouldRunTempoLoop()) {
      if (!tempoRafId) {
        tempoRafId = requestAnimationFrame(tickTempoLoop);
      }
      return;
    }

    if (tempoRafId) {
      cancelAnimationFrame(tempoRafId);
      tempoRafId = 0;
    }

    if (!playing) {
      resetTempoAnalysis();
    }
  };

  const paintIdleVisualizerFrame = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (!visualizerPrefs.enabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    spectrumNormalizer.reset();
    visualizerRuntime.reset();
    visualizerRuntime.draw({
      ctx,
      width: w,
      height: h,
      data: new Float32Array(barCount),
      ...getBarDrawContextBase(),
      playing: false,
      tempo: AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
      deltaSeconds: 0,
    });
  };

  const stopVisualizerLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    vizLoopActive = false;
  };

  const drawVisualizer = () => {
    if (!shouldAnimateBarVisualizer()) {
      stopVisualizerLoop();
      return;
    }

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (analyser) {
      analyser.getByteFrequencyData(rawFreq);
      sampleCanvasVisualizerTimeDomain(analyser, rawTime, timeWave);
      const activePresetId = resolveBarVisualizerPresetForSurface(
        visualizerPrefs,
        canvas.closest('[data-irp-bar-fullscreen="true"]') !== null ? 'expanded' : 'dock'
      );
      const smoothing = clampScopeSmoothing(visualizerPrefs.scopeSmoothing);
      const timeDataForDraw = isScopeVisualizerPreset(activePresetId) ? smoothedTimeWave : timeWave;
      if (isScopeVisualizerPreset(activePresetId)) {
        for (let index = 0; index < timeWave.length; index += 1) {
          smoothedTimeWave[index] =
            smoothedTimeWave[index] * smoothing + (timeWave[index] ?? 0) * (1 - smoothing);
        }
      }
      const deltaSeconds = advanceTempoAnalysis(rawFreq);
      const normalized = spectrumNormalizer.normalize(rawFreq, deltaSeconds || 1 / 60);

      visualizerRuntime.draw({
        ctx,
        width: w,
        height: h,
        data: normalized,
        ...getBarDrawContextBase(),
        timeData: timeDataForDraw,
        playing: true,
        tempo: tempoUniforms,
        deltaSeconds: deltaSeconds || 1 / 60,
      });
    }

    rafId = requestAnimationFrame(drawVisualizer);
  };

  const startVisualizerLoop = () => {
    if (vizLoopActive || !shouldAnimateBarVisualizer()) {
      return;
    }

    vizLoopActive = true;
    rafId = requestAnimationFrame(drawVisualizer);
  };

  const syncVisualizerLoop = () => {
    syncTempoLoop();
    if (shouldAnimateBarVisualizer()) {
      startVisualizerLoop();
      return;
    }

    stopVisualizerLoop();
    paintIdleVisualizerFrame();
  };

  const onVisibilityChange = () => {
    syncVisualizerLoop();

    if (document.visibilityState === 'hidden') {
      stopNowPlayingPoll();
      if (!playing && audioCtx?.state === 'running') {
        void audioCtx.suspend();
      }
      return;
    }

    if (audioCtx?.state === 'suspended' && playing) {
      void audioCtx.resume();
    }

    if (playing) {
      startNowPlayingPoll();
    }
  };

  let visualizerModeObserver: MutationObserver | null = null;

  if (typeof MutationObserver !== 'undefined') {
    visualizerModeObserver = new MutationObserver(() => {
      syncVisualizerLoop();
    });
    visualizerModeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  document.addEventListener('visibilitychange', onVisibilityChange);

  const setPlayingUi = (isPlaying: boolean): void => {
    if (headless || !shell || !playBtn) {
      return;
    }
    shell.classList.toggle('irp__shell--playing', isPlaying);
    playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  };

  const play = async () => {
    await ensureAudioGraph();
    try {
      await audio.play();
      playing = true;
      setPlayingUi(true);
      tap.hidden = true;
      needsTap = false;
      syncNowPlayingUi();
      startNowPlayingPoll();
      startVisualizerLoop();
      syncTempoLoop();
    } catch {
      tap.hidden = false;
      needsTap = true;
    }
  };

  const teardownStreamPlayback = (): void => {
    streamPlaybackHandle?.destroy();
    streamPlaybackHandle = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };

  const resumePlaybackAfterStationLoad = (loadToken: number): void => {
    if (loadToken !== stationLoadToken || !playing || needsTap) {
      return;
    }

    const attemptPlay = () => {
      if (loadToken !== stationLoadToken) {
        return;
      }

      void play();
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      attemptPlay();
      return;
    }

    const onReady = () => {
      audio.removeEventListener('canplay', onReady);
      audio.removeEventListener('loadeddata', onReady);
      attemptPlay();
    };

    audio.addEventListener('canplay', onReady);
    audio.addEventListener('loadeddata', onReady);
  };

  const reconnectActiveStationStream = (): void => {
    if (suppressStreamReconnect || !playing || needsTap || !stations[activeName]) {
      return;
    }

    const loadToken = ++stationLoadToken;

    void (async () => {
      teardownStreamPlayback();

      try {
        await bindResolvedStream(stations[activeName]);
      } catch {
        return;
      }

      if (loadToken !== stationLoadToken) {
        return;
      }

      resumePlaybackAfterStationLoad(loadToken);
    })();
  };

  audio.addEventListener('ended', () => {
    reconnectActiveStationStream();
  });

  audio.addEventListener('stalled', () => {
    if (!playing || needsTap) {
      return;
    }

    window.setTimeout(() => {
      if (playing && audio.paused && !needsTap) {
        reconnectActiveStationStream();
      }
    }, 1200);
  });

  const bindResolvedStream = async (sourceUrl: string): Promise<void> => {
    const resolved = await resolveRadioStreamUrl({ url: sourceUrl });

    if (resolved.playbackKind === 'hls') {
      streamPlaybackHandle = await attachRadioHlsPlayback(audio, resolved.sourceUrl);
      return;
    }

    audio.src = resolved.sourceUrl;
    audio.load();
  };

  const loadStation = (name: string, shouldResume: boolean): void => {
    const loadToken = ++stationLoadToken;
    const resumeAfterLoad = shouldResume;

    suppressStreamReconnect = true;
    activeName = name;
    localStorage.setItem(storageKey, name);
    teardownStreamPlayback();
    spectrumNormalizer.reset();
    visualizerRuntime.reset();
    resetNowPlaying();
    stopNowPlayingPoll();

    void (async () => {
      try {
        await bindResolvedStream(stations[name]);
      } catch (error) {
        console.warn('[Idling Radio] Failed to load station stream.', error);
        syncStationName();
        suppressStreamReconnect = false;
        return;
      }

      if (loadToken !== stationLoadToken) {
        return;
      }

      syncStationName();

      if (!resumeAfterLoad || needsTap) {
        suppressStreamReconnect = false;
        return;
      }

      resumePlaybackAfterStationLoad(loadToken);
      suppressStreamReconnect = false;
    })();
  };

  const pause = () => {
    audio.pause();
    playing = false;
    setPlayingUi(false);
    stopNowPlayingPoll();
    syncNowPlayingUi();
    syncVisualizerLoop();
  };

  tapBtn.addEventListener('click', () => void play());

  applyVisualizerThemeToRoot();
  if (!headless) {
    syncStationName();
  }
  loadStation(activeName, false);
  syncNowPlayingUi();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvasParkingHost.replaceChildren(canvas);
  paintIdleVisualizerFrame();

  if (options.autoplay !== false) {
    void play();
  }

  const mountBarCanvas = (container: HTMLElement): void => {
    if (!container) {
      return;
    }
    container.replaceChildren(canvas);
    rebuildVisualizer();
    resizeCanvas();
    paintIdleVisualizerFrame();
    syncVisualizerLoop();

    requestAnimationFrame(() => {
      resizeCanvas();
      paintIdleVisualizerFrame();
      syncVisualizerLoop();
    });
  };

  const unmountBarCanvas = (): void => {
    if (canvas.parentElement === canvasParkingHost) {
      return;
    }

    canvasParkingHost.replaceChildren(canvas);
    stopVisualizerLoop();
    paintIdleVisualizerFrame();
  };

  const resizeBarCanvas = () => {
    resizeCanvas();
    if (!playing) {
      paintIdleVisualizerFrame();
    }
  };

  const getBarCanvas = () => canvas;

  return {
    play,
    pause,
    destroy() {
      stopVisualizerLoop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      uiCleanup();
      visualizerModeObserver?.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      stopNowPlayingPoll();
      pause();
      teardownStreamPlayback();
      source?.disconnect();
      equalizerChain?.disconnect();
      analyser?.disconnect();
      void audioCtx?.close();
      clearRuntimeStationDefinitions();
      root.remove();
    },
    getStation: () => activeName,
    setStation: (name) => {
      if (stations[name]) loadStation(name, playing);
    },
    getStationNames: () => [...stationNames],
    isPlaying: () => playing,
    getNowPlaying: () => ({ ...nowPlaying }),
    getVolume: () => audio.volume,
    setVolume: (level) => {
      setVolumeLevel(level);
    },
    getVisualizerPreferences: () => ({ ...visualizerPrefs }),
    setVisualizerPreferences,
    getAudioStreamTempo: () => ({ ...tempoUniforms }),
    getEqualizerSettings: () => ({
      presetId: equalizerSettings.presetId,
      customPresetSlot: equalizerSettings.customPresetSlot,
      bandGains: [...equalizerSettings.bandGains],
      customPresets: equalizerSettings.customPresets.map((preset) => ({
        slot: preset.slot,
        label: preset.label,
        bandGains: [...preset.bandGains],
        savedAt: preset.savedAt,
      })),
      lastSelection: { ...equalizerSettings.lastSelection },
    }),
    setEqualizerBandGains: (bandGains) => {
      equalizerSettings = {
        ...equalizerSettings,
        presetId: null,
        customPresetSlot: null,
        bandGains: [...normalizeRadioEqualizerBandGains(bandGains)],
      };
      applyEqualizerToChain();
      void saveRadioEqualizerSettings(equalizerSettings);
    },
    applyEqualizerPreset: (presetId: RadioEqualizerPresetId) => {
      const preset = getRadioEqualizerPreset(presetId);
      equalizerSettings = {
        ...equalizerSettings,
        presetId,
        customPresetSlot: null,
        bandGains: [...preset.bandGains],
        lastSelection: createRadioEqualizerLastSelectionFromPreset(presetId),
      };
      applyEqualizerToChain();
      void saveRadioEqualizerSettings(equalizerSettings);
    },
    saveEqualizerCustomPreset: (slot: RadioEqualizerCustomSlot, label: string) => {
      const normalizedLabel = normalizeRadioEqualizerCustomPresetLabel(label, slot);
      const nextPresets = equalizerSettings.customPresets.map((preset) =>
        preset.slot === slot
          ? {
              slot,
              label: normalizedLabel,
              bandGains: [...normalizeRadioEqualizerBandGains(equalizerSettings.bandGains)],
              savedAt: Date.now(),
            }
          : preset
      );

      equalizerSettings = {
        ...equalizerSettings,
        presetId: null,
        customPresetSlot: slot,
        customPresets: nextPresets,
        lastSelection: createRadioEqualizerLastSelectionFromCustom(slot),
      };
      void saveRadioEqualizerSettings(equalizerSettings);
    },
    renameEqualizerCustomPreset: (slot: RadioEqualizerCustomSlot, label: string) => {
      const preset = equalizerSettings.customPresets.find((entry) => entry.slot === slot);
      if (!preset || !isRadioEqualizerCustomPresetSaved(preset)) {
        return;
      }

      const normalizedLabel = normalizeRadioEqualizerCustomPresetLabel(label, slot);
      const nextPresets = equalizerSettings.customPresets.map((entry) =>
        entry.slot === slot
          ? {
              ...entry,
              label: normalizedLabel,
            }
          : entry
      );

      equalizerSettings = {
        ...equalizerSettings,
        customPresets: nextPresets,
      };
      void saveRadioEqualizerSettings(equalizerSettings);
    },
    deleteEqualizerCustomPreset: (slot: RadioEqualizerCustomSlot) => {
      const nextPresets = deleteRadioEqualizerCustomPresetEntry(equalizerSettings.customPresets, slot);
      const clearedActiveSlot = equalizerSettings.customPresetSlot === slot;
      const clearedLastSelection =
        equalizerSettings.lastSelection.source === 'custom' &&
        equalizerSettings.lastSelection.customSlot === slot;

      equalizerSettings = {
        ...equalizerSettings,
        customPresets: nextPresets,
        customPresetSlot: clearedActiveSlot ? null : equalizerSettings.customPresetSlot,
        lastSelection: clearedLastSelection
          ? createRadioEqualizerLastSelectionFromPreset('flat')
          : equalizerSettings.lastSelection,
      };
      void saveRadioEqualizerSettings(equalizerSettings);
    },
    applyEqualizerCustomPreset: (slot: RadioEqualizerCustomSlot) => {
      const preset = equalizerSettings.customPresets.find((entry) => entry.slot === slot);
      if (!preset || !isRadioEqualizerCustomPresetSaved(preset)) {
        return;
      }

      equalizerSettings = {
        ...equalizerSettings,
        presetId: null,
        customPresetSlot: slot,
        bandGains: [...preset.bandGains],
        lastSelection: createRadioEqualizerLastSelectionFromCustom(slot),
      };
      applyEqualizerToChain();
      void saveRadioEqualizerSettings(equalizerSettings);
    },
    resetEqualizerToLastSelection: () => {
      const { lastSelection } = equalizerSettings;

      if (lastSelection.source === 'custom') {
        const preset = equalizerSettings.customPresets.find(
          (entry) => entry.slot === lastSelection.customSlot
        );
        if (preset && isRadioEqualizerCustomPresetSaved(preset)) {
          equalizerSettings = {
            ...equalizerSettings,
            presetId: null,
            customPresetSlot: lastSelection.customSlot,
            bandGains: [...preset.bandGains],
            lastSelection: createRadioEqualizerLastSelectionFromCustom(lastSelection.customSlot),
          };
          applyEqualizerToChain();
          void saveRadioEqualizerSettings(equalizerSettings);
        }
        return;
      }

      const preset = getRadioEqualizerPreset(lastSelection.presetId);
      equalizerSettings = {
        ...equalizerSettings,
        presetId: lastSelection.presetId,
        customPresetSlot: null,
        bandGains: [...preset.bandGains],
        lastSelection: createRadioEqualizerLastSelectionFromPreset(lastSelection.presetId),
      };
      applyEqualizerToChain();
      void saveRadioEqualizerSettings(equalizerSettings);
    },
    getAudioElement: () => audio,
    getAnalyser: () => analyser,
    getAudioContext: () => audioCtx,
    getBarCanvas,
    mountBarCanvas,
    unmountBarCanvas,
    resizeBarCanvas,
  };
}

export { DEFAULT_BAR_VISUALIZER_PREFERENCES, getBarVisualizerPresetDefinition };
export {
  advanceAudioStreamTempoPhase,
  AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
  createAudioStreamTempoState,
  describeAudioStreamTempoBpm,
  formatAudioStreamTempoBpmLabel,
  resolveAudioStreamTempoBpmDisplay,
  resolveAudioStreamTempoMotionRate,
  resolveAudioStreamTempoPhaseDelta,
  tickAudioStreamTempo,
} from './audioStreamTempo';
export type {
  AudioStreamTempoState,
  AudioStreamTempoUniforms,
  TickAudioStreamTempoInput,
  TickAudioStreamTempoResult,
} from './audioStreamTempo.types';
