import { IdlingOceEmbedRegistry } from './embedIdlingFetch';
import { parseRadioPlaylist } from './parseRadioPlaylist';
import {
  detectRadioStreamFormat,
  getRadioStreamPlaybackKind,
  radioStreamFormatRequiresResolution,
} from './radioStreamFormatCatalog';
import type {
  RadioStreamFormatId,
  RadioStreamPlaybackKind,
  RadioStreamTextFetcher,
  ResolveRadioStreamInput,
  ResolvedRadioStream,
} from './radioStreamFormat.types';

const DEFAULT_MAX_REDIRECTS = 5;

export function browserPlaylistRequestUrl(playlistUrl: string): string {
  return `/api/radio/playlist?url=${encodeURIComponent(playlistUrl)}`;
}

/** Browser playback proxies playlists. Vitest and the server fetch them directly. */
export function playlistFetchUsesAppProxy(hasWindow: boolean, vitest: string | undefined): boolean {
  return hasWindow && vitest !== 'true';
}

export class RadioStreamResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RadioStreamResolutionError';
  }
}

async function defaultFetchText(url: string): Promise<string> {
  const requestUrl = playlistFetchUsesAppProxy(typeof window !== 'undefined', process.env.VITEST)
    ? browserPlaylistRequestUrl(url)
    : url;
  const response = await IdlingOceEmbedRegistry.fetch(requestUrl, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/vnd.apple.mpegurl, audio/x-mpegurl, audio/mpegurl, */*',
      'User-Agent': 'IdlingRadioResolver/1.0',
    },
  });

  if (!response.ok) {
    throw new RadioStreamResolutionError(`Playlist fetch failed (${response.status}).`);
  }

  return response.text();
}

function toResolvedStream(sourceUrl: string, formatId: RadioStreamFormatId): ResolvedRadioStream {
  return {
    sourceUrl,
    formatId,
    playbackKind: getRadioStreamPlaybackKind(formatId),
  };
}

async function resolveRadioStreamUrlInternal(
  url: string,
  fetchText: RadioStreamTextFetcher,
  maxRedirects: number,
  redirectCount: number
): Promise<ResolvedRadioStream> {
  const formatId = detectRadioStreamFormat(url);

  if (!radioStreamFormatRequiresResolution(formatId)) {
    return toResolvedStream(url, formatId);
  }

  if (redirectCount >= maxRedirects) {
    throw new RadioStreamResolutionError('Exceeded playlist redirect limit.');
  }

  const content = await fetchText(url);
  const parsed = parseRadioPlaylist({ content, baseUrl: url });

  if (!parsed.ok || !parsed.streamUrl) {
    throw new RadioStreamResolutionError(parsed.message ?? 'Could not parse playlist.');
  }

  return resolveRadioStreamUrlInternal(parsed.streamUrl, fetchText, maxRedirects, redirectCount + 1);
}

export async function resolveRadioStreamUrl(
  input: ResolveRadioStreamInput
): Promise<ResolvedRadioStream> {
  const fetchText = input.fetchText ?? defaultFetchText;
  const maxRedirects = input.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const normalizedUrl = input.url.trim();

  return resolveRadioStreamUrlInternal(normalizedUrl, fetchText, maxRedirects, 0);
}

export function resolvedStreamPlaybackKind(stream: ResolvedRadioStream): RadioStreamPlaybackKind {
  return stream.playbackKind;
}
