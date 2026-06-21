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
  {
    name: 'Radio Paradise',
    url: 'https://stream-dc1.radioparadise.com/mp3-128',
    genre: 'eclectic',
    regionFlag: '🇺🇸',
    blurb: 'Curated eclectic mix from California',
  },
  {
    name: 'Radio Paradise (EU)',
    url: 'https://stream-uk1.radioparadise.com/mp3-128',
    genre: 'eclectic',
    regionFlag: '🇪🇺',
    blurb: 'Same Radio Paradise feed, EU edge server',
  },
  {
    name: 'Jazz24',
    url: 'https://live.wostreaming.net/direct/ppm-jazz24mp3-ibc1',
    genre: 'jazz',
    regionFlag: '🇺🇸',
    blurb: '24/7 jazz from American Public Media',
  },
  {
    name: 'WFMU Freeform',
    url: 'https://stream0.wfmu.org/freeform-128k.mp3',
    genre: 'community',
    regionFlag: '🇺🇸',
    blurb: 'Listener-supported freeform from New Jersey',
  },
  {
    name: 'WNYC',
    url: 'https://fm939.wnyc.org/wnycfm',
    genre: 'public',
    regionFlag: '🇺🇸',
    blurb: 'New York City public radio',
  },
  {
    name: 'WQXR Classical',
    url: 'https://stream.wqxr.org/wqxr',
    genre: 'classical',
    regionFlag: '🇺🇸',
    blurb: 'Classical music from New York Public Radio',
  },
  {
    name: 'Classical MPR',
    url: 'https://cms.stream.publicradio.org/cms.mp3',
    genre: 'classical',
    regionFlag: '🇺🇸',
    blurb: 'Classical Minnesota Public Radio',
  },
  {
    name: 'MPR News',
    url: 'https://nis.stream.publicradio.org/nis.mp3',
    genre: 'news',
    regionFlag: '🇺🇸',
    blurb: 'Minnesota Public Radio news',
  },
  {
    name: 'KEXP Seattle',
    url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    genre: 'eclectic',
    regionFlag: '🇺🇸',
    blurb: 'Independent music from Seattle',
  },
  {
    name: 'FIP',
    url: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
    genre: 'eclectic',
    regionFlag: '🇫🇷',
    blurb: 'Eclectic music from Radio France',
    supportsTrackMetadata: false,
  },
  {
    name: 'France Inter',
    url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
    genre: 'public',
    regionFlag: '🇫🇷',
    blurb: 'Flagship general-interest public radio',
    supportsTrackMetadata: false,
  },
  {
    name: 'France Musique',
    url: 'https://icecast.radiofrance.fr/francemusique-midfi.mp3',
    genre: 'classical',
    regionFlag: '🇫🇷',
    blurb: 'Classical and jazz from Radio France',
    supportsTrackMetadata: false,
  },
  {
    name: 'France Culture',
    url: 'https://icecast.radiofrance.fr/franceculture-midfi.mp3',
    genre: 'public',
    regionFlag: '🇫🇷',
    blurb: 'Arts, ideas, and culture',
    supportsTrackMetadata: false,
  },
  {
    name: 'Mouv',
    url: 'https://icecast.radiofrance.fr/mouv-midfi.mp3',
    genre: 'electronic',
    regionFlag: '🇫🇷',
    blurb: 'Urban and electronic from Radio France',
    supportsTrackMetadata: false,
  },
  {
    name: 'Radio Swiss Jazz',
    url: 'https://stream.srg-ssr.ch/m/rsj/mp3_128',
    genre: 'jazz',
    regionFlag: '🇨🇭',
    blurb: 'Swiss public jazz service',
  },
  {
    name: 'Radio Swiss Classic',
    url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    genre: 'classical',
    regionFlag: '🇨🇭',
    blurb: 'Swiss public classical service',
  },
  {
    name: 'Radio Swiss Pop',
    url: 'https://stream.srg-ssr.ch/m/rsp/mp3_128',
    genre: 'eclectic',
    regionFlag: '🇨🇭',
    blurb: 'Swiss public pop and rock',
  },
  {
    name: 'Couleur 3',
    url: 'https://stream.srg-ssr.ch/m/couleur3/mp3_128',
    genre: 'electronic',
    regionFlag: '🇨🇭',
    blurb: 'Alternative and electronic from RTS',
  },
  {
    name: 'FluxFM',
    url: 'https://channels.fluxfm.de/FluxFM/externalembedflxhp/stream.mp3',
    genre: 'electronic',
    regionFlag: '🇩🇪',
    blurb: 'Berlin-based alternative radio',
  },
  {
    name: 'NTS Radio 1',
    url: 'https://stream-relay-geo.ntslive.net/stream',
    genre: 'eclectic',
    regionFlag: '🇬🇧',
    blurb: 'Global music from London — channel 1',
  },
  {
    name: 'NTS Radio 2',
    url: 'https://stream-relay-geo.ntslive.net/stream2',
    genre: 'eclectic',
    regionFlag: '🇬🇧',
    blurb: 'Global music from London — channel 2',
  },
  {
    name: 'Ambient Sleeping Pill',
    url: 'https://radio.stereoscenic.com/asp-s',
    genre: 'ambient',
    regionFlag: '🌙',
    blurb: 'Continuous ambient for sleep and focus',
  },
  {
    name: 'Radio Nova Paris',
    url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3',
    genre: 'eclectic',
    regionFlag: '🇫🇷',
    blurb: 'Eclectic Paris independent radio',
    supportsTrackMetadata: false,
  },
  {
    name: 'Radio Caroline',
    url: 'https://radiocaroline.ice.infomaniak.ch/radiocaroline-128.mp3',
    genre: 'community',
    regionFlag: '🇬🇧',
    blurb: 'Offshore heritage rock radio',
  },
  {
    name: 'RTR FM Perth',
    url: 'https://live.rtrfm.com.au/stream.mp3',
    genre: 'community',
    regionFlag: '🇦🇺',
    blurb: 'Community radio from Perth',
  },
  {
    name: 'RNZ National',
    url: 'https://radionz.co.nz/audio/national',
    genre: 'public',
    regionFlag: '🇳🇿',
    blurb: 'Radio New Zealand National',
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
