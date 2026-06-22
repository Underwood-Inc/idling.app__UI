import type { BarVisualizerDensity, BarVisualizerPreferences } from './barVisualizer.types';

export interface RadioStationCatalog {
  [stationName: string]: string;
}

export type RadioStationGenreId =
  | 'ambient'
  | 'classical'
  | 'community'
  | 'custom'
  | 'eclectic'
  | 'electronic'
  | 'jazz'
  | 'news'
  | 'public';

/** How the `<audio>` element loads this source. */
export type CustomAudioSourceKind = 'live-stream' | 'static-media';

export interface CustomAudioSourceRecord {
  id: string;
  name: string;
  url: string;
  kind: CustomAudioSourceKind;
  genre: RadioStationGenreId;
  regionFlag: string;
  blurb: string;
  supportsTrackMetadata: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomAudioSourceInput {
  name: string;
  url: string;
  kind: CustomAudioSourceKind;
  genre?: RadioStationGenreId;
  regionFlag?: string;
  blurb?: string;
  supportsTrackMetadata?: boolean;
}

/** URL-only input for the simplified add-custom-source flow. */
export interface AddCustomAudioSourceUrlInput {
  url: string;
}

export interface CustomAudioSourceValidationResult {
  ok: boolean;
  normalizedUrl?: string;
  message?: string;
}

export interface RadioStationDefinition {
  name: string;
  url: string;
  genre: RadioStationGenreId;
  /** Regional flag emoji shown beside the station name. */
  regionFlag: string;
  /** Short human-readable description for browse lists. */
  blurb: string;
  /** When false, skip now-playing polls — stream does not publish ICY track titles. */
  supportsTrackMetadata?: boolean;
  /** Present when the source was added in this browser (IndexedDB). */
  customId?: string;
}

export interface RadioStationGenre {
  id: RadioStationGenreId;
  label: string;
}

export interface RadioStationGenreGroup {
  genre: RadioStationGenre;
  stations: RadioStationDefinition[];
}

export interface RadioStationGenreFilter {
  genre: RadioStationGenre;
  count: number;
}

export interface RadioPlayerOptions {
  stations?: RadioStationCatalog;
  /** Merged catalog + custom definitions for ICY metadata policy. */
  stationDefinitions?: RadioStationDefinition[];
  storageKey?: string;
  autoplay?: boolean;
  nowPlayingEndpoint?: string;
  /** idling.app React bar — engine + canvas only, no vanilla chrome */
  headless?: boolean;
}

export interface RadioNowPlayingInfo {
  streamTitle: string | null;
  artist: string | null;
  title: string | null;
  display: string | null;
}

export type { BarVisualizerPreferences, BarVisualizerDensity };

export interface RadioPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  destroy: () => void;
  getStation: () => string;
  setStation: (name: string) => void;
  getStationNames: () => string[];
  isPlaying: () => boolean;
  getNowPlaying: () => RadioNowPlayingInfo;
  getVolume: () => number;
  setVolume: (level: number) => void;
  getVisualizerPreferences: () => BarVisualizerPreferences;
  setVisualizerPreferences: (prefs: Partial<BarVisualizerPreferences>) => void;
  getAudioElement: () => HTMLAudioElement;
  getAnalyser: () => AnalyserNode | null;
  getAudioContext: () => AudioContext | null;
  getBarCanvas: () => HTMLCanvasElement;
  mountBarCanvas: (container: HTMLElement) => void;
  resizeBarCanvas: () => void;
}

export interface RadioStationProbeFailure {
  name: string;
  url: string;
  reason: string;
}

export interface RadioStationProbeResult {
  available: RadioStationCatalog;
  failures: RadioStationProbeFailure[];
}
