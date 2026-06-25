export interface RadioNowPlayingSearchInput {
  display: string | null;
  artist: string | null;
  title: string | null;
}

export interface RadioNowPlayingSearchUrlOptions {
  query: string;
}

const PLACEHOLDER_TRACK_LABELS = new Set(['listening...', 'listening…']);

export function isUsableRadioNowPlayingSearchDisplay(display: string | null): display is string {
  if (!display) {
    return false;
  }

  const normalized = display.trim().toLowerCase();
  return normalized.length > 0 && !PLACEHOLDER_TRACK_LABELS.has(normalized);
}

export function resolveRadioNowPlayingSearchQuery({
  display,
  artist,
  title,
}: RadioNowPlayingSearchInput): string | null {
  const trimmedArtist = artist?.trim() ?? '';
  const trimmedTitle = title?.trim() ?? '';

  if (trimmedArtist && trimmedTitle) {
    return `${trimmedArtist} ${trimmedTitle}`;
  }

  if (isUsableRadioNowPlayingSearchDisplay(display)) {
    return display.trim();
  }

  if (trimmedTitle) {
    return trimmedTitle;
  }

  if (trimmedArtist) {
    return trimmedArtist;
  }

  return null;
}

export function buildRadioNowPlayingSearchUrl({ query }: RadioNowPlayingSearchUrlOptions): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function openRadioNowPlayingSearchInBrowser(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) {
    return;
  }

  const url = buildRadioNowPlayingSearchUrl({ query: query.trim() });
  window.open(url, '_blank', 'noopener,noreferrer');
}
