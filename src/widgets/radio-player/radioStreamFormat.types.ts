export type RadioStreamFormatId = 'direct' | 'hls' | 'pls' | 'm3u';

export type RadioStreamPlaybackKind = 'native' | 'hls';

export interface RadioStreamFormatCatalogEntry {
  id: RadioStreamFormatId;
  label: string;
  playbackKind: RadioStreamPlaybackKind;
}

export interface ResolvedRadioStream {
  sourceUrl: string;
  playbackKind: RadioStreamPlaybackKind;
  formatId: RadioStreamFormatId;
}

export interface ResolveRadioStreamInput {
  url: string;
  fetchText?: RadioStreamTextFetcher;
  maxRedirects?: number;
}

export type RadioStreamTextFetcher = (url: string) => Promise<string>;

export interface ParseRadioPlaylistInput {
  content: string;
  baseUrl: string;
}

export interface ParseRadioPlaylistResult {
  ok: boolean;
  streamUrl?: string;
  message?: string;
}
