import type {
  CreateCustomAudioSourceInput,
  CustomAudioSourceKind,
  CustomAudioSourceRecord,
  CustomAudioSourceValidationResult,
  RadioStationCatalog,
  RadioStationDefinition,
  RadioStationGenre,
  RadioStationGenreId,
} from './radioPlayer.types';
import { listRadioStationGenres, RADIO_STATION_GENRES } from './radioStationBrowse';

export const CUSTOM_AUDIO_SOURCE_URL_HINT =
  'HTTPS direct audio URL — MP3/AAC/Ogg Icecast or Shoutcast mount, or a static .mp3/.ogg file. HLS (.m3u8) and playlist files (.pls, .m3u) are not supported.';

const CUSTOM_AUDIO_SOURCE_GENRE_IDS = new Set<RadioStationGenreId>(
  Object.keys(RADIO_STATION_GENRES) as RadioStationGenreId[]
);

export function listCustomAudioSourceGenreOptions(): RadioStationGenre[] {
  return listRadioStationGenres();
}

export function isCustomAudioSourceGenreId(value: string): value is RadioStationGenreId {
  return CUSTOM_AUDIO_SOURCE_GENRE_IDS.has(value as RadioStationGenreId);
}

export function validateCustomAudioSourceGenre(
  genreId: RadioStationGenreId
): CustomAudioSourceValidationResult {
  if (!isCustomAudioSourceGenreId(genreId)) {
    return { ok: false, message: 'Choose a valid genre.' };
  }

  return { ok: true };
}

export function normalizeCustomAudioSourceRecord(
  record: CustomAudioSourceRecord
): CustomAudioSourceRecord {
  const genre = isCustomAudioSourceGenreId(record.genre) ? record.genre : defaultCustomSourceGenreId();

  return {
    ...record,
    genre,
  };
}

const UNSUPPORTED_URL_PATTERN = /\.(m3u8|pls|xspf|m3u)(\?|$)/i;

const DIRECT_AUDIO_EXTENSION_PATTERN =
  /\.(mp3|aac|ogg|opus|wav|flac|caf|m4a|mp4a)(\?|$)/i;

export function normalizeCustomAudioSourceUrl(rawUrl: string): string {
  return rawUrl.trim();
}

export function validateCustomAudioSourceUrl(rawUrl: string): CustomAudioSourceValidationResult {
  const trimmed = normalizeCustomAudioSourceUrl(rawUrl);

  if (!trimmed) {
    return { ok: false, message: 'Enter a stream or media URL.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, message: 'URL must be absolute, e.g. https://example.com/stream.mp3' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, message: 'Only http(s) audio URLs are supported.' };
  }

  if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
    return {
      ok: false,
      message: 'Use HTTPS for remote streams. HTTP is allowed only on localhost.',
    };
  }

  const pathname = `${parsed.pathname}${parsed.search}`.toLowerCase();
  if (UNSUPPORTED_URL_PATTERN.test(pathname)) {
    return {
      ok: false,
      message: 'Playlist and HLS links are not supported. Paste a direct MP3/AAC/Ogg stream URL.',
    };
  }

  return { ok: true, normalizedUrl: parsed.toString() };
}

export function validateCustomAudioSourceName(
  name: string,
  reservedNames: string[]
): CustomAudioSourceValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { ok: false, message: 'Name must be at least 2 characters.' };
  }

  if (trimmed.length > 80) {
    return { ok: false, message: 'Name must be 80 characters or fewer.' };
  }

  const normalized = trimmed.toLowerCase();
  if (reservedNames.some((reserved) => reserved.toLowerCase() === normalized)) {
    return { ok: false, message: 'That name is already used by another source.' };
  }

  return { ok: true };
}

export function defaultCustomAudioSourceBlurb(kind: CustomAudioSourceKind): string {
  return kind === 'static-media' ? 'Custom static audio file' : 'Custom live audio stream';
}

export function projectCustomAudioSourceToDefinition(
  record: CustomAudioSourceRecord
): RadioStationDefinition {
  return {
    name: record.name,
    url: record.url,
    genre: record.genre,
    regionFlag: record.regionFlag,
    blurb: record.blurb,
    supportsTrackMetadata: record.supportsTrackMetadata,
    customId: record.id,
  };
}

export function mergeCustomAudioSourcesIntoDefinitions(
  catalogDefinitions: RadioStationDefinition[],
  customSources: CustomAudioSourceRecord[]
): RadioStationDefinition[] {
  const customDefinitions = customSources.map(projectCustomAudioSourceToDefinition);
  return [...catalogDefinitions, ...customDefinitions];
}

export function buildCatalogFromDefinitions(
  definitions: RadioStationDefinition[]
): RadioStationCatalog {
  const catalog: RadioStationCatalog = {};

  definitions.forEach((definition) => {
    catalog[definition.name] = definition.url;
  });

  return catalog;
}

export function buildCustomAudioSourceCatalog(
  customSources: CustomAudioSourceRecord[]
): RadioStationCatalog {
  return buildCatalogFromDefinitions(customSources.map(projectCustomAudioSourceToDefinition));
}

export function listReservedAudioSourceNames(
  catalogDefinitions: RadioStationDefinition[],
  customSources: CustomAudioSourceRecord[],
  excludeCustomId?: string
): string[] {
  const customNames = customSources
    .filter((source) => source.id !== excludeCustomId)
    .map((source) => source.name);

  return [...catalogDefinitions.map((definition) => definition.name), ...customNames];
}

export function createCustomAudioSourceRecord(
  input: CreateCustomAudioSourceInput,
  reservedNames: string[]
): { ok: true; record: CustomAudioSourceRecord } | { ok: false; message: string } {
  const nameResult = validateCustomAudioSourceName(input.name, reservedNames);
  if (!nameResult.ok) {
    return { ok: false, message: nameResult.message ?? 'Invalid name.' };
  }

  const urlResult = validateCustomAudioSourceUrl(input.url);
  if (!urlResult.ok || !urlResult.normalizedUrl) {
    return { ok: false, message: urlResult.message ?? 'Invalid URL.' };
  }

  const genre = input.genre ?? defaultCustomSourceGenreId();
  const genreResult = validateCustomAudioSourceGenre(genre);
  if (!genreResult.ok) {
    return { ok: false, message: genreResult.message ?? 'Invalid genre.' };
  }

  const kind = input.kind;
  const now = new Date().toISOString();

  return {
    ok: true,
    record: {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      url: urlResult.normalizedUrl,
      kind,
      genre,
      regionFlag: input.regionFlag?.trim() || '★',
      blurb: input.blurb?.trim() || defaultCustomAudioSourceBlurb(kind),
      supportsTrackMetadata: input.supportsTrackMetadata ?? kind === 'live-stream',
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function isCustomAudioSourceDefinition(
  definition: RadioStationDefinition
): definition is RadioStationDefinition & { customId: string } {
  return typeof definition.customId === 'string' && definition.customId.length > 0;
}

export function defaultCustomSourceGenreId(): RadioStationGenreId {
  return 'custom';
}

export function updateCustomAudioSourceGenre(
  record: CustomAudioSourceRecord,
  genreId: RadioStationGenreId
): { ok: true; record: CustomAudioSourceRecord } | { ok: false; message: string } {
  const genreResult = validateCustomAudioSourceGenre(genreId);
  if (!genreResult.ok) {
    return { ok: false, message: genreResult.message ?? 'Invalid genre.' };
  }

  return {
    ok: true,
    record: {
      ...record,
      genre: genreId,
      updatedAt: new Date().toISOString(),
    },
  };
}
