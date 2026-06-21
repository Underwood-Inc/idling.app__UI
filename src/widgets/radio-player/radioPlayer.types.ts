import type { BarVisualizerDensity, BarVisualizerPreferences } from './barVisualizer.types';

export interface RadioStationCatalog {
  [stationName: string]: string;
}

export interface RadioStationDefinition {
  name: string;
  url: string;
  /** When false, skip now-playing polls — stream does not publish ICY track titles. */
  supportsTrackMetadata?: boolean;
}

export interface RadioPlayerOptions {
  stations?: RadioStationCatalog;
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
