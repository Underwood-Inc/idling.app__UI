import type {
  RadioStreamFormatCatalogEntry,
  RadioStreamFormatId,
  RadioStreamPlaybackKind,
} from './radioStreamFormat.types';

export const RADIO_STREAM_FORMAT_CATALOG: RadioStreamFormatCatalogEntry[] = [
  { id: 'direct', label: 'Direct stream', playbackKind: 'native' },
  { id: 'hls', label: 'HLS', playbackKind: 'hls' },
  { id: 'pls', label: 'PLS playlist', playbackKind: 'native' },
  { id: 'm3u', label: 'M3U playlist', playbackKind: 'native' },
];

const FORMAT_BY_ID = Object.fromEntries(
  RADIO_STREAM_FORMAT_CATALOG.map((entry) => [entry.id, entry])
) as Record<RadioStreamFormatId, RadioStreamFormatCatalogEntry>;

const HLS_URL_PATTERN = /\.m3u8(\?|$)/i;
const PLS_URL_PATTERN = /\.pls(\?|$)/i;
const M3U_URL_PATTERN = /\.m3u(\?|$)/i;

export function detectRadioStreamFormat(url: string): RadioStreamFormatId {
  const candidate = `${url}`.trim().toLowerCase();

  if (HLS_URL_PATTERN.test(candidate)) {
    return 'hls';
  }

  if (PLS_URL_PATTERN.test(candidate)) {
    return 'pls';
  }

  if (M3U_URL_PATTERN.test(candidate)) {
    return 'm3u';
  }

  return 'direct';
}

export function getRadioStreamFormatCatalogEntry(
  formatId: RadioStreamFormatId
): RadioStreamFormatCatalogEntry {
  return FORMAT_BY_ID[formatId];
}

export function getRadioStreamPlaybackKind(formatId: RadioStreamFormatId): RadioStreamPlaybackKind {
  return getRadioStreamFormatCatalogEntry(formatId).playbackKind;
}

export function radioStreamFormatRequiresResolution(formatId: RadioStreamFormatId): boolean {
  return formatId === 'pls' || formatId === 'm3u';
}
