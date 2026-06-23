// Route enum for type safety
import { RADIO_PWA_MANIFEST_HREF } from './radio-pwa/constants';

export enum ROUTE_KEYS {
  ROOT = 'ROOT',
  CARD_GENERATOR = 'CARD_GENERATOR',
  SVG_CONVERTER = 'SVG_CONVERTER',
  GALAXY = 'GALAXY',
  MAPPY = 'MAPPY',
  POSTS = 'POSTS',
  MY_POSTS = 'MY_POSTS',
  COINS = 'COINS',
  GAME = 'GAME',
  SIGNIN = 'SIGNIN',
  CALLBACK = 'CALLBACK',
  THREAD_BASE = 'THREAD_BASE',
  ADMIN = 'ADMIN',
  // Strixun Stream Suite
  STRIXUN_STREAM_SUITE = 'STRIXUN_STREAM_SUITE',
  // Strixun Stream Suite External Links
  STREAM_SUITE = 'STREAM_SUITE',
  MODS_HUB = 'MODS_HUB',
  AUTH_SERVICE = 'AUTH_SERVICE',
  URL_SHORTENER = 'URL_SHORTENER',
  ACCESS_HUB = 'ACCESS_HUB',
  // Strixun Stream Suite Detail Pages
  STREAM_SUITE_DETAIL = 'STREAM_SUITE_DETAIL',
  MODS_HUB_DETAIL = 'MODS_HUB_DETAIL',
  AUTH_SERVICE_DETAIL = 'AUTH_SERVICE_DETAIL',
  URL_SHORTENER_DETAIL = 'URL_SHORTENER_DETAIL',
  ACCESS_HUB_DETAIL = 'ACCESS_HUB_DETAIL'
}

// Route paths mapping
export const NAV_PATHS: Record<ROUTE_KEYS, string> = {
  [ROUTE_KEYS.ROOT]: '/',
  [ROUTE_KEYS.CARD_GENERATOR]: '/card-generator',
  [ROUTE_KEYS.SVG_CONVERTER]: '/svg-converter',
  [ROUTE_KEYS.GALAXY]: 'https://galaxy.idling.app/',
  [ROUTE_KEYS.MAPPY]: 'https://short.army/mappy',
  [ROUTE_KEYS.POSTS]: '/posts',
  [ROUTE_KEYS.MY_POSTS]: '/my-posts',
  [ROUTE_KEYS.COINS]: '/coins',
  [ROUTE_KEYS.GAME]: '/game',
  [ROUTE_KEYS.SIGNIN]: '/auth/signin',
  [ROUTE_KEYS.CALLBACK]: '/auth/callback',
  [ROUTE_KEYS.THREAD_BASE]: '/t',
  [ROUTE_KEYS.ADMIN]: '/admin',
  // Strixun Stream Suite
  [ROUTE_KEYS.STRIXUN_STREAM_SUITE]: '/strixun-stream-suite',
  // Strixun Stream Suite External Links
  [ROUTE_KEYS.STREAM_SUITE]: 'https://streamkit.idling.app',
  [ROUTE_KEYS.MODS_HUB]: 'https://mods.idling.app',
  [ROUTE_KEYS.AUTH_SERVICE]: 'https://auth.idling.app',
  [ROUTE_KEYS.URL_SHORTENER]: 'https://s.idling.app',
  [ROUTE_KEYS.ACCESS_HUB]: 'https://access.idling.app',
  // Strixun Stream Suite Detail Pages
  [ROUTE_KEYS.STREAM_SUITE_DETAIL]: '/strixun-stream-suite/stream-suite',
  [ROUTE_KEYS.MODS_HUB_DETAIL]: '/strixun-stream-suite/mods-hub',
  [ROUTE_KEYS.AUTH_SERVICE_DETAIL]: '/strixun-stream-suite/auth-service',
  [ROUTE_KEYS.URL_SHORTENER_DETAIL]: '/strixun-stream-suite/url-shortener',
  [ROUTE_KEYS.ACCESS_HUB_DETAIL]: '/strixun-stream-suite/access-hub'
};

// Helper function to build thread URLs
export const buildThreadUrl = (submissionId: number) =>
  `${NAV_PATHS[ROUTE_KEYS.THREAD_BASE]}/${submissionId}`;

// Check if a URL is external
export const isExternalLink = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

// Navigation groups for better organization
export interface NavGroup {
  label: string;
  items: ROUTE_KEYS[];
}

export type NavGroups = Record<string, NavGroup>;

/**
 * NAV_GROUPS organizes navigation routes into logical groups for the navigation UI.
 * Each group has a label and an array of ROUTE_KEYS that belong to that group.
 */
export const NAV_GROUPS: NavGroups = {
  TOOLS: {
    label: 'Tools',
    items: [ROUTE_KEYS.CARD_GENERATOR, ROUTE_KEYS.SVG_CONVERTER, ROUTE_KEYS.STRIXUN_STREAM_SUITE]
  },
  CONTENT: {
    label: 'Content',
    items: [ROUTE_KEYS.POSTS, ROUTE_KEYS.MY_POSTS]
  },
  EXTERNAL: {
    label: 'External',
    items: [
      ROUTE_KEYS.GALAXY,
      ROUTE_KEYS.MAPPY,
      ROUTE_KEYS.STREAM_SUITE,
      ROUTE_KEYS.MODS_HUB,
      ROUTE_KEYS.AUTH_SERVICE,
      ROUTE_KEYS.URL_SHORTENER,
      ROUTE_KEYS.ACCESS_HUB
    ]
  }
};

export const HEADER_NAV_PATHS: Record<
  Exclude<
    ROUTE_KEYS,
    | ROUTE_KEYS.ROOT
    | ROUTE_KEYS.SIGNIN
    | ROUTE_KEYS.COINS
    | ROUTE_KEYS.GAME
    | ROUTE_KEYS.THREAD_BASE
    | ROUTE_KEYS.ADMIN
    | ROUTE_KEYS.CALLBACK
    | ROUTE_KEYS.STREAM_SUITE_DETAIL
    | ROUTE_KEYS.MODS_HUB_DETAIL
    | ROUTE_KEYS.AUTH_SERVICE_DETAIL
    | ROUTE_KEYS.URL_SHORTENER_DETAIL
    | ROUTE_KEYS.ACCESS_HUB_DETAIL
  >,
  string
> = {
  [ROUTE_KEYS.CARD_GENERATOR]: NAV_PATHS[ROUTE_KEYS.CARD_GENERATOR],
  [ROUTE_KEYS.SVG_CONVERTER]: NAV_PATHS[ROUTE_KEYS.SVG_CONVERTER],
  [ROUTE_KEYS.GALAXY]: NAV_PATHS[ROUTE_KEYS.GALAXY],
  [ROUTE_KEYS.MAPPY]: NAV_PATHS[ROUTE_KEYS.MAPPY],
  [ROUTE_KEYS.POSTS]: NAV_PATHS[ROUTE_KEYS.POSTS],
  [ROUTE_KEYS.MY_POSTS]: NAV_PATHS[ROUTE_KEYS.MY_POSTS],
  // Strixun Stream Suite
  [ROUTE_KEYS.STRIXUN_STREAM_SUITE]: NAV_PATHS[ROUTE_KEYS.STRIXUN_STREAM_SUITE],
  [ROUTE_KEYS.STREAM_SUITE]: NAV_PATHS[ROUTE_KEYS.STREAM_SUITE],
  [ROUTE_KEYS.MODS_HUB]: NAV_PATHS[ROUTE_KEYS.MODS_HUB],
  [ROUTE_KEYS.AUTH_SERVICE]: NAV_PATHS[ROUTE_KEYS.AUTH_SERVICE],
  [ROUTE_KEYS.URL_SHORTENER]: NAV_PATHS[ROUTE_KEYS.URL_SHORTENER],
  [ROUTE_KEYS.ACCESS_HUB]: NAV_PATHS[ROUTE_KEYS.ACCESS_HUB]
};

export type ROUTES = ROUTE_KEYS;

export const NAV_PATH_LABELS: Record<ROUTE_KEYS, string> = {
  [ROUTE_KEYS.ROOT]: 'Home',
  [ROUTE_KEYS.CARD_GENERATOR]: 'Card Generator',
  [ROUTE_KEYS.SVG_CONVERTER]: 'SVG to PNG',
  [ROUTE_KEYS.GALAXY]: 'Galaxy',
  [ROUTE_KEYS.MAPPY]: 'Mappy',
  [ROUTE_KEYS.POSTS]: 'Posts',
  [ROUTE_KEYS.MY_POSTS]: 'My Posts',
  [ROUTE_KEYS.COINS]: 'Coins',
  [ROUTE_KEYS.GAME]: 'Game',
  [ROUTE_KEYS.SIGNIN]: 'Sign In',
  [ROUTE_KEYS.CALLBACK]: 'Callback',
  [ROUTE_KEYS.THREAD_BASE]: 'Thread',
  [ROUTE_KEYS.ADMIN]: 'Admin',
  // Strixun Stream Suite Labels
  [ROUTE_KEYS.STRIXUN_STREAM_SUITE]: 'Strixun Stream Suite',
  [ROUTE_KEYS.STREAM_SUITE]: 'Stream Suite',
  [ROUTE_KEYS.MODS_HUB]: 'Mods Hub',
  [ROUTE_KEYS.AUTH_SERVICE]: 'Auth Service',
  [ROUTE_KEYS.URL_SHORTENER]: 'URL Shortener',
  [ROUTE_KEYS.ACCESS_HUB]: 'Access Hub',
  // Strixun Stream Suite Detail Page Labels
  [ROUTE_KEYS.STREAM_SUITE_DETAIL]: 'Stream Suite Details',
  [ROUTE_KEYS.MODS_HUB_DETAIL]: 'Mods Hub Details',
  [ROUTE_KEYS.AUTH_SERVICE_DETAIL]: 'Auth Service Details',
  [ROUTE_KEYS.URL_SHORTENER_DETAIL]: 'URL Shortener Details',
  [ROUTE_KEYS.ACCESS_HUB_DETAIL]: 'Access Hub Details'
};

export const DISABLED_PATHS = [NAV_PATHS.GAME, NAV_PATHS.COINS];

/** PWA manifest start_url only — never linked from site navigation. */
export {
  IDLING_RADIO_PWA_SHELL_HEADER,
  IDLING_RADIO_PWA_START_PATH,
  RADIO_PWA_MANIFEST_HREF,
} from './radio-pwa/constants';

export const PUBLIC_ROUTES = [
  NAV_PATHS.ROOT,
  NAV_PATHS.SIGNIN,
  NAV_PATHS.CARD_GENERATOR,
  NAV_PATHS.SVG_CONVERTER,
  NAV_PATHS.POSTS,
  NAV_PATHS.STRIXUN_STREAM_SUITE,
  NAV_PATHS.STREAM_SUITE_DETAIL,
  NAV_PATHS.MODS_HUB_DETAIL,
  NAV_PATHS.AUTH_SERVICE_DETAIL,
  NAV_PATHS.URL_SHORTENER_DETAIL,
  NAV_PATHS.ACCESS_HUB_DETAIL,
  '/auth/unlink-account',
  '/idling-radio'
];

export const PRIVATE_ROUTES = [NAV_PATHS.ADMIN, NAV_PATHS.MY_POSTS];

/** Static infra (PWA, ads.txt) — auth applies to web pages only, not these paths. */
export const PUBLIC_INFRA_PATHS = [
  '/manifest.json',
  RADIO_PWA_MANIFEST_HREF,
  '/sw.js',
  '/offline.html',
  '/ads.txt'
] as const;

/** API prefixes reachable without a session (health, OG, radio stations, etc.). */
export const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/status',
  '/api/version',
  '/api/og-image',
  '/api/user-subscriptions',
  '/api/test/',
  '/api/monitoring/',
  '/api/ping',
  '/api/ready',
  '/api/live',
  '/api/radio/'
] as const;

export function isPublicInfraPath(pathname: string): boolean {
  return (PUBLIC_INFRA_PATHS as readonly string[]).includes(pathname);
}

export function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

export function isPublicPagePath(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/t/') ||
    pathname.startsWith('/profile/') ||
    pathname.startsWith('/auth/')
  );
}

export const DEFAULT_REDIRECT = '/';
