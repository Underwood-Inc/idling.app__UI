import { RADIO_STATION_DEFINITIONS } from './radioStationCatalog';
import type { RadioStationDefinition } from './radioPlayer.types';

export const RADIO_NO_TRACK_METADATA_STORAGE_KEY = 'idling-radio-no-track-metadata';

const catalogMetadataSupport = new Map<string, boolean>(
  RADIO_STATION_DEFINITIONS.map((definition) => [
    definition.name,
    definition.supportsTrackMetadata !== false,
  ])
);

let runtimeMetadataSupport: Map<string, boolean> | null = null;

export function setRuntimeStationDefinitions(definitions: RadioStationDefinition[]): void {
  runtimeMetadataSupport = new Map(
    definitions.map((definition) => [
      definition.name,
      definition.supportsTrackMetadata !== false,
    ])
  );
}

export function clearRuntimeStationDefinitions(): void {
  runtimeMetadataSupport = null;
}

export function getCatalogTrackMetadataSupport(stationName: string): boolean {
  if (runtimeMetadataSupport?.has(stationName)) {
    return runtimeMetadataSupport.get(stationName) ?? false;
  }

  return catalogMetadataSupport.get(stationName) ?? false;
}

export function loadTrackMetadataDenylist(): string[] {
  try {
    const raw = localStorage.getItem(RADIO_NO_TRACK_METADATA_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [];
  }
}

export function rememberTrackMetadataUnsupported(stationName: string): void {
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

export function stationSupportsTrackMetadata(stationName: string): boolean {
  if (!getCatalogTrackMetadataSupport(stationName)) {
    return false;
  }

  return !loadTrackMetadataDenylist().includes(stationName);
}
