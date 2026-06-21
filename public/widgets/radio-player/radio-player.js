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

/** @typedef {import('./radioPlayer.types').RadioStationCatalog} RadioStationCatalog */
/** @typedef {import('./radioPlayer.types').RadioPlayerOptions} RadioPlayerOptions */
/** @typedef {import('./radioPlayer.types').RadioPlayerHandle} RadioPlayerHandle */
/** @typedef {import('./radioPlayer.types').RadioNowPlayingInfo} RadioNowPlayingInfo */
/** @typedef {import('./barVisualizer.types').BarVisualizerPreferences} BarVisualizerPreferences */

import {
  BAR_COUNT_BY_DENSITY,
  DEFAULT_BAR_VISUALIZER_PREFERENCES,
  loadBarVisualizerPreferences,
  saveBarVisualizerPreferences,
} from './barVisualizerPreferences';
import {
  BAR_VISUALIZER_PRESET_DEFINITIONS,
  createBarVisualizerRuntime,
  getBarVisualizerPresetDefinition,
} from './barVisualizerPresets';
import { getBarVisualizerTheme } from './barVisualizerThemes';
import {
  rememberTrackMetadataUnsupported,
  stationSupportsTrackMetadata,
} from './radioStationMetadata';
import { RADIO_STATIONS as CATALOG_STATIONS } from './radioStationCatalog';
import { createSpectrumNormalizer } from './spectrumNormalization';

/** @type {RadioStationCatalog} */
export const RADIO_STATIONS = CATALOG_STATIONS;

export const RADIO_PLAYER_STORAGE_KEY = 'idling-radio-player-station';

const ANALYSER_FFT_SIZE = 2048;
const NOW_PLAYING_POLL_MS = 20000;

const PLAY_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>`;
const CHEVRON_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m6 9 6 6 6-6"/></svg>`;
const BARS_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M4 10h3v10H4V10zm6.5-4h3v14h-3V6zm7 6h3v8h-3v-8z"/></svg>`;
const IRP_NO_GLASS_CLASS = 'no-glass';

/** @type {Record<import('./barVisualizer.types').BarVisualizerDensity, string>} */
const DENSITY_LABELS = {
  compact: 'Compact',
  normal: 'Normal',
  wide: 'Wide',
};

/**
 * @param {{
 *   shell: HTMLElement,
 *   anchor: HTMLElement,
 *   panel: HTMLElement,
 *   trigger: HTMLButtonElement,
 *   openShellClass: string,
 *   widthForTrigger: (triggerRect: DOMRect) => number,
 * }} config
 */
function createIrpDropdown(config) {
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

  const setOpen = (open) => {
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

/**
 * @param {HTMLElement} block
 * @param {HTMLInputElement} input
 * @param {() => number} getVolume
 * @param {(level: number) => void} setVolumeLevel
 */
function attachVolumeControl(block, input, getVolume, setVolumeLevel) {
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

/**
 * @param {ParentNode} mountNode
 * @param {RadioPlayerOptions} [options]
 * @returns {RadioPlayerHandle}
 */
export function mountRadioPlayer(mountNode, options = {}) {
  const stations = options.stations ?? RADIO_STATIONS;
  const storageKey = options.storageKey ?? RADIO_PLAYER_STORAGE_KEY;
  const nowPlayingEndpoint = options.nowPlayingEndpoint ?? '/api/radio/now-playing';
  const headless = options.headless === true;
  const stationNames = Object.keys(stations);
  const saved = localStorage.getItem(storageKey);
  let activeName = saved && stations[saved] ? saved : stationNames[0];

  /** @type {BarVisualizerPreferences} */
  let visualizerPrefs = loadBarVisualizerPreferences();
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

  const shell = headless ? null : /** @type {HTMLElement} */ (root.querySelector('.irp__shell'));
  const tap = /** @type {HTMLElement} */ (root.querySelector('.irp__tap'));
  const tapBtn = /** @type {HTMLButtonElement} */ (root.querySelector('.irp__tap-btn'));
  const canvas = /** @type {HTMLCanvasElement} */ (root.querySelector('.irp__viz'));
  const ctx = canvas.getContext('2d');
  const stationAnchor = headless
    ? null
    : /** @type {HTMLElement} */ (root.querySelector('.irp__picker-anchor--station'));
  const stationTrigger = headless
    ? null
    : /** @type {HTMLButtonElement} */ (root.querySelector('.irp__station-trigger'));
  const stationPanel = headless
    ? null
    : /** @type {HTMLElement} */ (root.querySelector('.irp__station-popover'));
  const stationList = headless
    ? null
    : /** @type {HTMLElement} */ (root.querySelector('.irp__station-list'));
  const lookAnchor = headless
    ? null
    : /** @type {HTMLElement} */ (root.querySelector('.irp__picker-anchor--look'));
  const lookTrigger = headless
    ? null
    : /** @type {HTMLButtonElement} */ (root.querySelector('.irp__look-trigger'));
  const lookPanel = headless
    ? null
    : /** @type {HTMLElement} */ (root.querySelector('.irp__look-popover'));
  const styleList = headless
    ? null
    : /** @type {HTMLElement} */ (root.querySelector('.irp__look-style-list'));
  const densityButtons = headless
    ? /** @type {NodeListOf<HTMLButtonElement>} */ ([])
    : /** @type {NodeListOf<HTMLButtonElement>} */ (
        root.querySelectorAll('.irp__look-density-btn')
      );
  const volumeBlock = headless
    ? null
    : /** @type {HTMLElement} */ (root.querySelector('.irp__volume-block'));
  const volume = headless
    ? null
    : /** @type {HTMLInputElement} */ (root.querySelector('.irp__volume'));
  const playBtn = headless ? null : /** @type {HTMLButtonElement} */ (root.querySelector('.irp__play'));
  const meta = headless ? null : /** @type {HTMLElement} */ (root.querySelector('.irp__identity'));
  const track = headless ? null : /** @type {HTMLElement} */ (root.querySelector('.irp__track'));
  const stationLine = headless ? null : /** @type {HTMLElement} */ (root.querySelector('.irp__station-line'));
  const label = headless ? null : /** @type {HTMLElement} */ (root.querySelector('.irp__label'));

  if (!ctx) {
    throw new Error('Radio player canvas context unavailable');
  }

  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.preload = 'none';

  /** @type {(() => void) | null} */
  let syncVolumeUi = null;

  const clampVolume = (level) => Math.min(1, Math.max(0, level));

  const setVolumeLevel = (level) => {
    audio.volume = clampVolume(level);
    syncVolumeUi?.();
  };

  syncVolumeUi = headless
    ? null
    : attachVolumeControl(volumeBlock, volume, () => audio.volume, setVolumeLevel);

  /** @type {AudioContext | null} */
  let audioCtx = null;
  /** @type {AnalyserNode | null} */
  let analyser = null;
  /** @type {MediaElementAudioSourceNode | null} */
  let source = null;
  let rafId = 0;
  let vizLoopActive = false;
  let playing = false;
  let needsTap = true;
  /** @type {Uint8Array} */
  let rawFreq = new Uint8Array(ANALYSER_FFT_SIZE / 2);
  let spectrumNormalizer = createSpectrumNormalizer(barCount);
  let visualizerRuntime = createBarVisualizerRuntime(visualizerPrefs.presetId, barCount);
  /** @type {RadioNowPlayingInfo} */
  let nowPlaying = {
    streamTitle: null,
    artist: null,
    title: null,
    display: null,
  };
  let nowPlayingPollTimer = 0;
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
      const option = /** @type {HTMLButtonElement} */ (node);
      const selected = option.dataset.stationName === activeName;
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  };

  const setTrackDisplay = () => {
    if (headless || !track) {
      return;
    }
    const text = nowPlaying.display;
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
    const trackPart = nowPlaying.display ? ` · ${nowPlaying.display}` : '';
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

  /** @type {ReturnType<typeof createIrpDropdown>[]} */
  let dropdowns = [];
  /** @type {(() => void) | null} */
  let syncVisualizerControlsUi = null;

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

    const toggleDropdown = (dropdown) => {
      const willOpen = dropdown.panel.hidden;
      dropdowns.forEach((entry) => entry.setOpen(entry === dropdown ? willOpen : false));
    };

    const positionOpenPopovers = () => {
      dropdowns.forEach((dropdown) => dropdown.position());
    };

    syncVisualizerControlsUi = () => {
      const preset = getBarVisualizerPresetDefinition(visualizerPrefs.presetId);
      const densityLabel = DENSITY_LABELS[visualizerPrefs.density] ?? DENSITY_LABELS.normal;

      lookTrigger.setAttribute('title', `${preset.label} style · ${densityLabel} spacing`);
      lookTrigger.setAttribute(
        'aria-label',
        `Visualizer settings. ${preset.label} style, ${densityLabel} bar spacing.`
      );

      styleList.querySelectorAll('.irp__look-style-option').forEach((node) => {
        const option = /** @type {HTMLButtonElement} */ (node);
        const selected = option.dataset.presetId === visualizerPrefs.presetId;
        option.setAttribute('aria-selected', selected ? 'true' : 'false');
      });

      densityButtons.forEach((button) => {
        const selected = button.dataset.density === visualizerPrefs.density;
        button.setAttribute('aria-checked', selected ? 'true' : 'false');
      });
    };

    const buildVisualizerControls = () => {
      styleList.replaceChildren();
      BAR_VISUALIZER_PRESET_DEFINITIONS.forEach((preset) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = `irp__picker-option irp__look-style-option ${IRP_NO_GLASS_CLASS}`;
        option.dataset.presetId = preset.id;
        option.setAttribute('role', 'option');
        option.title = preset.description;
        option.textContent = preset.label;
        option.addEventListener('click', () => {
          setVisualizerPreferences({ presetId: preset.id });
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

      syncVisualizerControlsUi();
    };

    const onPopoverPointerDown = (event) => {
      const target = /** @type {Node | null} */ (event.target);

      for (const dropdown of dropdowns) {
        if (dropdown.panel.hidden) {
          continue;
        }

        if (!target || (!dropdown.panel.contains(target) && !dropdown.trigger.contains(target))) {
          dropdown.setOpen(false);
        }
      }
    };

    const onPopoverKeyDown = (event) => {
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

    /** @type {ResizeObserver | null} */
    let barHeightObserver = null;

    const syncBarHeight = () => {
      const heightPx = Math.ceil(shell.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--irp-bar-height', `${heightPx}px`);
    };

    if (typeof ResizeObserver !== 'undefined') {
      barHeightObserver = new ResizeObserver(syncBarHeight);
      barHeightObserver.observe(shell);
      syncBarHeight();
    }

    var uiCleanup = () => {
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
    var uiCleanup = () => {};
  }

  const rebuildVisualizer = () => {
    barCount = BAR_COUNT_BY_DENSITY[visualizerPrefs.density] ?? BAR_COUNT_BY_DENSITY.normal;
    spectrumNormalizer = createSpectrumNormalizer(barCount);
    visualizerRuntime = createBarVisualizerRuntime(visualizerPrefs.presetId, barCount);
    applyVisualizerThemeToRoot();
    syncVisualizerControlsUi?.();
    saveBarVisualizerPreferences(visualizerPrefs);
    syncVisualizerLoop();
  };

  /** @param {Partial<BarVisualizerPreferences>} nextPrefs */
  const setVisualizerPreferences = (nextPrefs) => {
    visualizerPrefs = {
      presetId: nextPrefs.presetId ?? visualizerPrefs.presetId,
      density: nextPrefs.density ?? visualizerPrefs.density,
    };
    rebuildVisualizer();
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

      /** @type {{ station?: string; streamTitle?: string | null; artist?: string | null; title?: string | null; display?: string | null; supportsTrackMetadata?: boolean }} */
      const data = await response.json();
      if (data.station !== stationAtFetch || !playing) {
        return;
      }

      if (data.supportsTrackMetadata === false) {
        rememberTrackMetadataUnsupported(stationAtFetch);
        stopNowPlayingPoll();
        syncNowPlayingUi();
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
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const ensureAudioGraph = async () => {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
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
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        rawFreq = new Uint8Array(analyser.frequencyBinCount);
      } catch {
        analyser = null;
      }
    }
  };

  const isVisualizerModeActive = () =>
    document.documentElement.classList.contains('visualizer-mode');

  const shouldAnimateBarVisualizer = () =>
    playing &&
    !prefersReducedMotion &&
    document.visibilityState === 'visible' &&
    !isVisualizerModeActive();

  const paintIdleVisualizerFrame = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    spectrumNormalizer.reset();
    visualizerRuntime.reset();
    visualizerRuntime.draw({
      ctx,
      width: w,
      height: h,
      data: new Float32Array(barCount),
      theme: getBarVisualizerTheme(),
      state: visualizerRuntime.getState(),
      playing: false,
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
      const normalized = spectrumNormalizer.normalize(rawFreq);
      visualizerRuntime.draw({
        ctx,
        width: w,
        height: h,
        data: normalized,
        theme: getBarVisualizerTheme(),
        state: visualizerRuntime.getState(),
        playing: true,
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

  /** @type {MutationObserver | null} */
  let visualizerModeObserver = null;

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

  const setPlayingUi = (isPlaying) => {
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
    } catch {
      tap.hidden = false;
      needsTap = true;
    }
  };

  const loadStation = (name, shouldResume) => {
    activeName = name;
    localStorage.setItem(storageKey, name);
    audio.src = stations[name];
    audio.load();
    spectrumNormalizer.reset();
    visualizerRuntime.reset();
    resetNowPlaying();
    stopNowPlayingPoll();

    if (!shouldResume || needsTap) {
      syncStationName();
      return;
    }

    const resume = () => {
      audio.removeEventListener('canplay', resume);
      void play();
    };

    audio.addEventListener('canplay', resume);
    void play();
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
  paintIdleVisualizerFrame();

  if (options.autoplay !== false) {
    void play();
  }

  const mountBarCanvas = (container) => {
    if (!container) {
      return;
    }
    container.replaceChildren(canvas);
    resizeCanvas();
    paintIdleVisualizerFrame();
    syncVisualizerLoop();
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
      audio.src = '';
      source?.disconnect();
      analyser?.disconnect();
      void audioCtx?.close();
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
    getAudioElement: () => audio,
    getAnalyser: () => analyser,
    getAudioContext: () => audioCtx,
    getBarCanvas,
    mountBarCanvas,
  };
}

export { DEFAULT_BAR_VISUALIZER_PREFERENCES, getBarVisualizerPresetDefinition };
