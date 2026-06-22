export interface ProbeRadioStreamResult {
  ok: boolean;
  reason?: string;
}

export interface ProbeRadioStreamOptions {
  timeoutMs?: number;
}

export interface RadioHlsPlaybackHandle {
  destroy: () => void;
}

export interface RadioHlsInstance {
  loadSource: (url: string) => void;
  attachMedia: (media: HTMLMediaElement) => void;
  destroy: () => void;
}

export interface RadioHlsLibrary {
  isSupported: () => boolean;
  new (config?: Record<string, unknown>): RadioHlsInstance;
}

export interface RadioHlsLoader {
  load: () => Promise<RadioHlsLibrary>;
}
