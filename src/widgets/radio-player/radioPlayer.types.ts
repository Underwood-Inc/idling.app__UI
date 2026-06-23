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
  /** Station definitions for ICY metadata policy. */
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

export type RadioStationAvailabilityStatus = 'pending' | 'available' | 'unreachable';

export interface RadioStationAvailabilityState {
  name: string;
  url: string;
  status: RadioStationAvailabilityStatus;
  reason?: string;
}

export type RadioStationAvailabilityMap = Record<string, RadioStationAvailabilityState>;

export interface RadioStationProbeFailure {
  name: string;
  url: string;
  reason: string;
}

export interface RadioStationProbeResult {
  available: RadioStationCatalog;
  failures: RadioStationProbeFailure[];
}
