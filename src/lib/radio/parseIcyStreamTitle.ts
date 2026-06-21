import type { RadioNowPlaying, SplitArtistTitleResult } from './radioNowPlaying.types';

export function parseIcyStreamTitle(metadataText: string): string | null {
  const cleaned = metadataText.replace(/\0/g, '').trim();
  if (!cleaned) {
    return null;
  }

  const singleQuoteMatch = cleaned.match(/StreamTitle='([^']*)'/i);
  if (singleQuoteMatch?.[1] !== undefined) {
    const title = singleQuoteMatch[1].trim();
    return title.length > 0 ? title : null;
  }

  const doubleQuoteMatch = cleaned.match(/StreamTitle="([^"]*)"/i);
  if (doubleQuoteMatch?.[1] !== undefined) {
    const title = doubleQuoteMatch[1].trim();
    return title.length > 0 ? title : null;
  }

  return null;
}

export function splitArtistTitle(rawTitle: string): SplitArtistTitleResult {
  const trimmed = rawTitle.trim();
  if (!trimmed) {
    return { artist: null, title: null };
  }

  const separatorIndex = trimmed.indexOf(' - ');
  if (separatorIndex === -1) {
    return { artist: null, title: trimmed };
  }

  const artist = trimmed.slice(0, separatorIndex).trim();
  const title = trimmed.slice(separatorIndex + 3).trim();

  return {
    artist: artist.length > 0 ? artist : null,
    title: title.length > 0 ? title : null,
  };
}

export function buildNowPlayingDisplay(
  streamTitle: string | null,
  station: string
): string | null {
  if (!streamTitle) {
    return null;
  }

  const { artist, title } = splitArtistTitle(streamTitle);

  if (artist && title) {
    return `${artist} — ${title}`;
  }

  if (title) {
    return title;
  }

  if (artist) {
    return artist;
  }

  return streamTitle || station;
}

export function buildRadioNowPlaying(
  station: string,
  streamTitle: string | null,
  supportsTrackMetadata: boolean
): RadioNowPlaying {
  const { artist, title } = streamTitle ? splitArtistTitle(streamTitle) : { artist: null, title: null };

  return {
    station,
    streamTitle,
    artist,
    title,
    display: buildNowPlayingDisplay(streamTitle, station),
    supportsTrackMetadata,
  };
}
