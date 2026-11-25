import type { RadioStationGenreId } from '@widgets/radio-player/radioPlayer.types';

export interface RadioEnAriaCopy {
  player: string;
  chooseStation: string;
  searchStations: string;
  clearSearch: string;
  filterByGenre: string;
  stations: string;
  playerSettings: string;
  fullscreenVisualizerStyle: string;
  fullscreenVisualizerStyles: string;
  waveLineStyle: string;
  oscilloscopeSmoothing: string;
  barFillStyle: string;
  barTrailStyle: string;
  barGlow: string;
  visualizerColors: string;
  spectrumVisualizerColors: string;
  fullscreenSpectrumOpacity: string;
  fullscreenVisualizerHeight: string;
  barVisualizerLook: string;
  barVisualizerStyles: string;
  controlBarVisualizerLayout: string;
  controlBarVisualizerOpacity: string;
  barSpacing: string;
  stationTransport: string;
  previousStation: string;
  nextStation: string;
  dragToWidenText: string;
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  volume: string;
  volumeScrollHint: string;
  enterFullscreen: string;
  exitFullscreen: string;
  openFullscreenVisualizer: string;
  exitFullscreenVisualizer: string;
  equalizer: string;
  equalizerPresets: string;
  customEqualizerPresets: string;
  equalizerBands: string;
  fullTrackTitle: string;
  trackTitleTrigger: string;
  dragToResizePanel: string;
  recheckStationPrefix: string;
  changeStationPrefix: string;
  nowOnSuffix: string;
  checkingStreamTitle: string;
  changeStationTitle: string;
  playerSettingsTitle: string;
  searchWebForTrack: string;
  findTrackTitle: string;
  addFavorite: string;
  removeFavorite: string;
}

export interface RadioEnBarCopy {
  pressPlayToStart: string;
  searchPlaceholder: string;
  checkingStationsOne: string;
  checkingStationsMany: string;
  filterAll: string;
  filterFavorites: string;
  filterUnreachable: string;
  recheckAll: string;
  emptyUnreachable: string;
  emptyFavorites: string;
  emptySearchPrefix: string;
  checkingStreamAvailability: string;
}

export interface RadioEnSettingsCopy {
  look: string;
  none: string;
  waveStyle: string;
  waveSmoothing: string;
  barFill: string;
  barTrail: string;
  barGlow: string;
  barColors: string;
  spectrumColors: string;
  spectrumOpacity: string;
  spectrumHeight: string;
  barLayout: string;
  opacity: string;
  density: string;
  barStyle: string;
  trail: string;
  glow: string;
  colors: string;
  visualizerHeight: string;
  webglUnavailableFallback: string;
}

export interface RadioEnVisualizerOptionCopy {
  line: string;
  ribbon: string;
  solid: string;
  glass: string;
  none: string;
  peaks: string;
  cascade: string;
  off: string;
  soft: string;
  theme: string;
  prism: string;
  compact: string;
  normal: string;
  wide: string;
  fullBackground: string;
  inlineStrip: string;
}

export interface RadioEnGenreCopy extends Record<RadioStationGenreId, string> {}

export interface RadioEnLocalizedPresetCopy {
  label: string;
  description: string;
}

export interface RadioEnPresetLabelsCopy {
  webgl: Record<string, RadioEnLocalizedPresetCopy>;
  bar: Record<string, RadioEnLocalizedPresetCopy>;
  spectrum: Record<string, string>;
}

export interface RadioEnEqualizerUiCopy {
  title: string;
  reset: string;
  resetAriaPrefix: string;
  load: string;
  save: string;
  delete: string;
  confirm: string;
  cancel: string;
  matchExact: string;
  matchNear: string;
  deleteConfirm: string;
  customSlotDefault: string;
  loadPresetAria: string;
  emptySlotAria: string;
  slotEmptyTitle: string;
  nameSlotAria: string;
  saveToAria: string;
  deletePresetAria: string;
  confirmDeleteAria: string;
  cancelDeleteAria: string;
  presets: Record<string, string>;
}

export interface RadioEnBpmCopy {
  label: string;
  paused: string;
  silent: string;
  stable: string;
  estimating: string;
  listening: string;
}

export interface RadioEnCopy {
  aria: RadioEnAriaCopy;
  bar: RadioEnBarCopy;
  settings: RadioEnSettingsCopy;
  visualizer: RadioEnVisualizerOptionCopy;
  genres: RadioEnGenreCopy;
  equalizer: RadioEnEqualizerUiCopy;
  bpm: RadioEnBpmCopy;
  presetLabels: RadioEnPresetLabelsCopy;
}

export const RADIO_EN = {
  aria: {
    player: 'Radio player',
    chooseStation: 'Choose a station',
    searchStations: 'Search stations by name, description, or genre',
    clearSearch: 'Clear station search',
    filterByGenre: 'Filter by genre',
    stations: 'Stations',
    playerSettings: 'Player settings',
    fullscreenVisualizerStyle: 'Fullscreen visualizer style',
    fullscreenVisualizerStyles: 'Fullscreen visualizer styles',
    waveLineStyle: 'Wave line style',
    oscilloscopeSmoothing: 'Oscilloscope wave smoothing',
    barFillStyle: 'Bar fill style',
    barTrailStyle: 'Bar trail style',
    barGlow: 'Bar glow',
    visualizerColors: 'Visualizer colors',
    spectrumVisualizerColors: 'Spectrum visualizer colors',
    fullscreenSpectrumOpacity: 'Fullscreen spectrum opacity',
    fullscreenVisualizerHeight: 'Fullscreen visualizer height',
    barVisualizerLook: 'Bar visualizer look',
    barVisualizerStyles: 'Bar visualizer styles',
    controlBarVisualizerLayout: 'Control bar visualizer layout',
    controlBarVisualizerOpacity: 'Control bar visualizer opacity',
    barSpacing: 'Bar spacing',
    stationTransport: 'Station transport',
    previousStation: 'Previous station',
    nextStation: 'Next station',
    dragToWidenText: 'Drag to widen station and track text. Double-click to reset.',
    play: 'Play',
    pause: 'Pause',
    mute: 'Mute',
    unmute: 'Unmute',
    volume: 'Volume',
    volumeScrollHint: 'Volume — scroll to adjust',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    openFullscreenVisualizer: 'Open fullscreen visualizer',
    exitFullscreenVisualizer: 'Exit fullscreen visualizer',
    equalizer: 'Equalizer',
    equalizerPresets: 'Equalizer presets',
    customEqualizerPresets: 'Custom equalizer presets',
    equalizerBands: 'Equalizer bands',
    fullTrackTitle: 'Full track title',
    trackTitleTrigger: 'Now playing: {track}. Click to show full title.',
    dragToResizePanel: 'Drag to resize panel. Double-click to reset height.',
    recheckStationPrefix: 'Re-check',
    changeStationPrefix: 'Change station — now on',
    nowOnSuffix: '',
    checkingStreamTitle: 'Checking stream',
    changeStationTitle: 'Change station',
    playerSettingsTitle: 'Player settings',
    searchWebForTrack: 'Search the web for {query}',
    findTrackTitle: 'Find “{query}”',
    addFavorite: 'Add {stationName} to favorites',
    removeFavorite: 'Remove {stationName} from favorites',
  },
  bar: {
    pressPlayToStart: 'Press play to start',
    searchPlaceholder: 'Search stations… ("Radio France" or #jazz)',
    checkingStationsOne: 'Checking 1 station…',
    checkingStationsMany: 'Checking {count} stations…',
    filterAll: 'All',
    filterFavorites: 'Favorites',
    filterUnreachable: 'Unreachable',
    recheckAll: 'Re-check all',
    emptyUnreachable: 'No unreachable stations match this filter.',
    emptyFavorites: 'No favorite stations match this filter.',
    emptySearchPrefix: 'No stations match',
    checkingStreamAvailability: 'Checking stream availability…',
  },
  settings: {
    look: 'Look',
    none: 'None',
    waveStyle: 'Wave style',
    waveSmoothing: 'Wave smoothing',
    barFill: 'Bar fill',
    barTrail: 'Bar trail',
    barGlow: 'Bar glow',
    barColors: 'Bar colors',
    spectrumColors: 'Spectrum colors',
    spectrumOpacity: 'Spectrum opacity',
    spectrumHeight: 'Spectrum height',
    barLayout: 'Bar layout',
    opacity: 'Opacity',
    density: 'Density',
    barStyle: 'Bar style',
    trail: 'Trail',
    glow: 'Glow',
    colors: 'Colors',
    visualizerHeight: 'Visualizer height',
    webglUnavailableFallback: 'WebGL2 visualizers are not available in this browser.',
  },
  visualizer: {
    line: 'Line',
    ribbon: 'Ribbon',
    solid: 'Solid',
    glass: 'Glass',
    none: 'None',
    peaks: 'Peaks',
    cascade: 'Cascade',
    off: 'Off',
    soft: 'Soft',
    theme: 'Theme',
    prism: 'Prism',
    compact: 'Compact',
    normal: 'Normal',
    wide: 'Wide',
    fullBackground: 'Full background',
    inlineStrip: 'Inline strip',
  },
  genres: {
    ambient: 'Ambient',
    classical: 'Classical',
    community: 'Community',
    custom: 'Custom',
    eclectic: 'Eclectic',
    electronic: 'Electronic',
    jazz: 'Jazz',
    news: 'News & talk',
    public: 'Public radio',
  },
  equalizer: {
    title: 'Equalizer',
    reset: 'Reset',
    resetAriaPrefix: 'Reset equalizer to',
    load: 'Load',
    save: 'Save',
    delete: 'Delete',
    confirm: 'Confirm',
    cancel: 'Cancel',
    matchExact:
      'These slider settings match {label} exactly. Select that preset instead of duplicating it manually.',
    matchNear: 'These slider settings are close to {label}. Consider selecting that preset.',
    deleteConfirm: 'Delete saved preset "{label}"? This cannot be undone.',
    customSlotDefault: 'Custom {slot}',
    loadPresetAria: 'Load {label}',
    emptySlotAria: 'Custom preset slot {slot} is empty',
    slotEmptyTitle: 'Slot {slot} is empty',
    nameSlotAria: 'Name for custom preset slot {slot}',
    saveToAria: 'Save current EQ to {label}',
    deletePresetAria: 'Delete saved preset {label}',
    confirmDeleteAria: 'Confirm delete {label}',
    cancelDeleteAria: 'Cancel delete for {label}',
    presets: {
      flat: 'Flat',
      'bass-boost': 'Bass boost',
      'treble-boost': 'Treble boost',
      vocal: 'Vocal',
      rock: 'Rock',
      jazz: 'Jazz',
      electronic: 'Electronic',
      podcast: 'Podcast',
    },
  },
  bpm: {
    label: 'BPM',
    paused: 'Tempo unavailable while paused',
    silent: 'No clear beat in the stream right now',
    stable: 'Tempo {bpm} beats per minute',
    estimating: 'Approximate tempo {bpm} beats per minute',
    listening: 'Listening for beats in the stream',
  },
  presetLabels: {
    webgl: {
      'netrunner-grid': {
        label: 'Netrunner grid',
        description: '3D cyber avenue — neon towers on both sides over a scrolling grid',
      },
      'starry-horizon': {
        label: 'Starry horizon',
        description: 'Gold-to-teal EQ skyline on a low horizon — starry night mirrored in calm water',
      },
      'spectrum-bars': {
        label: 'Spectrum bars',
        description: 'Classic full-width EQ columns',
      },
      'mirror-bars': {
        label: 'Mirror bars',
        description: 'Symmetric spectrum columns from center',
      },
      'radial-spectrum': {
        label: 'Radial spectrum',
        description: 'Large circular analyzer filling the screen',
      },
      'waveform-path': {
        label: 'Waveform path',
        description: 'Oscilloscope stroke with phosphor trail',
      },
      'liquid-merge': {
        label: 'Liquid merge',
        description: 'Slow drifting color blobs that stretch, meet, and merge as they cross the screen',
      },
      'neon-constellation': {
        label: 'Neon constellation',
        description: 'Spherical neon mesh whose vertices and links morph with the music',
      },
    },
    bar: {
      'idling-bars': {
        label: 'Frequency bars',
        description: 'Classic spectrum bars with fill and trail options',
      },
      scope: {
        label: 'Oscilloscope',
        description: 'Live waveform trace',
      },
      mirror: {
        label: 'Mirror',
        description: 'Symmetric reflection',
      },
      wave: {
        label: 'Wave',
        description: 'Frequency wave line or ribbon',
      },
      dots: {
        label: 'Dots',
        description: 'Reactive particle dots',
      },
      'thread-weave': {
        label: 'Thread weave',
        description: 'Interlaced flowing threads',
      },
      'drift-mist': {
        label: 'Drift mist',
        description: 'Layered mist bands',
      },
      arc: {
        label: 'Arc',
        description: 'Radial arc ring',
      },
    },
    spectrum: {
      'radial-prism': 'Radial prism',
      'octave-classic': 'Octave bars',
      'mirror-rainbow': 'Mirror rainbow',
      'led-orangered': 'LED spectrum',
      'graph-steel': 'Wave graph',
      'dual-steel-prism': 'Dual channel',
    },
  },
} satisfies RadioEnCopy;