import { RADIO_STATION_DEFINITIONS } from './radioStationCatalog';
export const RADIO_NO_TRACK_METADATA_STORAGE_KEY = 'idling-radio-no-track-metadata';
const catalogMetadataSupport = new Map(RADIO_STATION_DEFINITIONS.map((definition) => [
    definition.name,
    definition.supportsTrackMetadata !== false,
]));
let runtimeMetadataSupport = null;
export function setRuntimeStationDefinitions(definitions) {
    runtimeMetadataSupport = new Map(definitions.map((definition) => [
        definition.name,
        definition.supportsTrackMetadata !== false,
    ]));
}
export function clearRuntimeStationDefinitions() {
    runtimeMetadataSupport = null;
}
export function getCatalogTrackMetadataSupport(stationName) {
    if (runtimeMetadataSupport?.has(stationName)) {
        return runtimeMetadataSupport.get(stationName) ?? false;
    }
    return catalogMetadataSupport.get(stationName) ?? false;
}
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
    }
    catch {
        return [];
    }
}
export function rememberTrackMetadataUnsupported(stationName) {
    const denylist = new Set(loadTrackMetadataDenylist());
    if (denylist.has(stationName)) {
        return;
    }
    denylist.add(stationName);
    localStorage.setItem(RADIO_NO_TRACK_METADATA_STORAGE_KEY, JSON.stringify([...denylist]));
}
export function stationSupportsTrackMetadata(stationName) {
    if (!getCatalogTrackMetadataSupport(stationName)) {
        return false;
    }
    return !loadTrackMetadataDenylist().includes(stationName);
}
