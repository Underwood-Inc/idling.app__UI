import type { RadioStationCatalog, RadioStationDefinition } from './radioPlayer.types';

/**
 * Production catalog — HTML5 `<audio>`-compatible HTTPS/MP3/AAC streams only.
 *
 * Included when the broadcaster publishes device/player URLs (public service, community,
 * or official external-player links). Excluded: direct hotlinks that forbid third-party
 * embedding (e.g. SomaFM ToS), creator-only catalogs (Chillhop/Lofi Girl livestreams),
 * and HLS-only mounts.
 *
 * Availability is still filtered at runtime by `/api/radio/stations` probing.
 */
export const RADIO_STATION_DEFINITIONS: RadioStationDefinition[] = [
  // Eclectic / listener-supported
  { name: 'Radio Paradise', url: 'https://stream-dc1.radioparadise.com/mp3-128' },
  { name: 'Radio Paradise (EU)', url: 'https://stream-uk1.radioparadise.com/mp3-128' },

  // US public & community
  { name: 'Jazz24', url: 'https://live.wostreaming.net/direct/ppm-jazz24mp3-ibc1' },
  { name: 'WFMU Freeform', url: 'https://stream0.wfmu.org/freeform-128k.mp3' },
  { name: 'WNYC', url: 'https://fm939.wnyc.org/wnycfm' },
  { name: 'WQXR Classical', url: 'https://stream.wqxr.org/wqxr' },
  { name: 'Classical MPR', url: 'https://cms.stream.publicradio.org/cms.mp3' },
  { name: 'MPR News', url: 'https://nis.stream.publicradio.org/nis.mp3' },
  { name: 'KEXP Seattle', url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3' },

  // France — Radio France public streams (no ICY track titles on these mounts)
  { name: 'FIP', url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', supportsTrackMetadata: false },
  {
    name: 'France Inter',
    url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
    supportsTrackMetadata: false,
  },
  {
    name: 'France Musique',
    url: 'https://icecast.radiofrance.fr/francemusique-midfi.mp3',
    supportsTrackMetadata: false,
  },
  {
    name: 'France Culture',
    url: 'https://icecast.radiofrance.fr/franceculture-midfi.mp3',
    supportsTrackMetadata: false,
  },
  { name: 'Mouv', url: 'https://icecast.radiofrance.fr/mouv-midfi.mp3', supportsTrackMetadata: false },

  // Switzerland — SRG SSR public streams
  { name: 'Radio Swiss Jazz', url: 'https://stream.srg-ssr.ch/m/rsj/mp3_128' },
  { name: 'Radio Swiss Classic', url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128' },
  { name: 'Radio Swiss Pop', url: 'https://stream.srg-ssr.ch/m/rsp/mp3_128' },
  { name: 'Couleur 3', url: 'https://stream.srg-ssr.ch/m/couleur3/mp3_128' },

  // Germany — FluxFM official external-player URL
  { name: 'FluxFM', url: 'https://channels.fluxfm.de/FluxFM/externalembedflxhp/stream.mp3' },

  // UK / global independent
  { name: 'NTS Radio 1', url: 'https://stream-relay-geo.ntslive.net/stream' },
  { name: 'NTS Radio 2', url: 'https://stream-relay-geo.ntslive.net/stream2' },

  // Ambient & specialty
  { name: 'Ambient Sleeping Pill', url: 'https://radio.stereoscenic.com/asp-s' },

  // France — independent (ICY present but no StreamTitle payloads observed)
  {
    name: 'Radio Nova Paris',
    url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3',
    supportsTrackMetadata: false,
  },

  // UK / AU community
  { name: 'Radio Caroline', url: 'https://radiocaroline.ice.infomaniak.ch/radiocaroline-128.mp3' },
  { name: 'RTR FM Perth', url: 'https://live.rtrfm.com.au/stream.mp3' },

  // Pacific public (no ICY metadata on this mount)
  {
    name: 'RNZ National',
    url: 'https://radionz.co.nz/audio/national',
    supportsTrackMetadata: false,
  },
];

export function buildRadioStationCatalog(
  definitions: RadioStationDefinition[]
): RadioStationCatalog {
  const catalog: RadioStationCatalog = {};

  definitions.forEach(({ name, url }) => {
    catalog[name] = url;
  });

  return catalog;
}

export const RADIO_STATIONS: RadioStationCatalog =
  buildRadioStationCatalog(RADIO_STATION_DEFINITIONS);

/** Optional localhost-only extras probed after the main catalog. */
export const LOCAL_DEV_RADIO_STATIONS: RadioStationCatalog = {};

export function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function buildRadioStationProbeCatalog(
  catalog: RadioStationCatalog,
  hostname: string,
  includeLocalDevFallbacks: boolean
): RadioStationCatalog {
  if (!includeLocalDevFallbacks || !isLocalDevHost(hostname)) {
    return catalog;
  }

  return { ...catalog, ...LOCAL_DEV_RADIO_STATIONS };
}
