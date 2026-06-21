/** Stations catalogued with supportsTrackMetadata: false — keep in sync with radioStationCatalog.ts */
/** @type {Set<string>} */
const CATALOG_NO_TRACK_METADATA = new Set([
  'FIP',
  'France Inter',
  'France Musique',
  'France Culture',
  'Mouv',
  'Radio Nova Paris',
  'RNZ National',
]);

/** @type {Map<string, boolean> | null} */
let runtimeMetadataSupport = null;

export const RADIO_NO_TRACK_METADATA_STORAGE_KEY = 'idling-radio-no-track-metadata';

/** @param {import('./radioPlayer.types').RadioStationDefinition[]} definitions */
export function setRuntimeStationDefinitions(definitions) {
  runtimeMetadataSupport = new Map(
    definitions.map((definition) => [
      definition.name,
      definition.supportsTrackMetadata !== false,
    ])
  );
}

export function clearRuntimeStationDefinitions() {
  runtimeMetadataSupport = null;
}

/** @param {string} stationName */
export function getCatalogTrackMetadataSupport(stationName) {
  if (runtimeMetadataSupport?.has(stationName)) {
    return runtimeMetadataSupport.get(stationName) ?? false;
  }

  return !CATALOG_NO_TRACK_METADATA.has(stationName);
}

/** @returns {string[]} */
export function loadTrackMetadataDenylist() {
  try {
    const raw = localStorage.getItem(RADIO_NO_TRACK_METADATA_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => typeof entry === 'string');
  } catch {
    return [];
  }
}

/** @param {string} stationName */
export function rememberTrackMetadataUnsupported(stationName) {
  const denylist = new Set(loadTrackMetadataDenylist());
  if (denylist.has(stationName)) {
    return;
  }

  denylist.add(stationName);
  localStorage.setItem(
    RADIO_NO_TRACK_METADATA_STORAGE_KEY,
    JSON.stringify([...denylist])
  );
}

/** @param {string} stationName */
export function stationSupportsTrackMetadata(stationName) {
  if (!getCatalogTrackMetadataSupport(stationName)) {
    return false;
  }

  return !loadTrackMetadataDenylist().includes(stationName);
}
