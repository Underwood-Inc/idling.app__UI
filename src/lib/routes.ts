// Route enum for type safety
export enum ROUTE_KEYS {
  ROOT = 'ROOT',
  CARD_GENERATOR = 'CARD_GENERATOR',
  SVG_CONVERTER = 'SVG_CONVERTER',
  GALAXY = 'GALAXY',
  POSTS = 'POSTS',
  MY_POSTS = 'MY_POSTS',
  COINS = 'COINS',
  GAME = 'GAME',
  SIGNIN = 'SIGNIN',
  CALLBACK = 'CALLBACK',
  THREAD_BASE = 'THREAD_BASE',
  ADMIN = 'ADMIN'
}

// Route paths mapping
export const NAV_PATHS: Record<ROUTE_KEYS, string> = {
  [ROUTE_KEYS.ROOT]: '/',
  [ROUTE_KEYS.CARD_GENERATOR]: '/card-generator',
  [ROUTE_KEYS.SVG_CONVERTER]: '/svg-converter',
  [ROUTE_KEYS.GALAXY]: 'https://galaxy.idling.app/',
  [ROUTE_KEYS.POSTS]: '/posts',
  [ROUTE_KEYS.MY_POSTS]: '/my-posts',
  [ROUTE_KEYS.COINS]: '/coins',
  [ROUTE_KEYS.GAME]: '/game',
  [ROUTE_KEYS.SIGNIN]: '/auth/signin',
  [ROUTE_KEYS.CALLBACK]: '/auth/callback',
  [ROUTE_KEYS.THREAD_BASE]: '/t',
  [ROUTE_KEYS.ADMIN]: '/admin'
};

// Helper function to build thread URLs
export const buildThreadUrl = (submissionId: number) =>
  `${NAV_PATHS[ROUTE_KEYS.THREAD_BASE]}/${submissionId}`;

// Check if a URL is external
export const isExternalLink = (url: string): boolean => {
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
    items: [ROUTE_KEYS.CARD_GENERATOR, ROUTE_KEYS.SVG_CONVERTER]
  },
  CONTENT: {
    label: 'Content',
    items: [ROUTE_KEYS.POSTS, ROUTE_KEYS.MY_POSTS]
  },
  EXTERNAL: {
    label: 'External',
    items: [ROUTE_KEYS.GALAXY]
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
  >,
  string
> = {
  [ROUTE_KEYS.CARD_GENERATOR]: NAV_PATHS[ROUTE_KEYS.CARD_GENERATOR],
  [ROUTE_KEYS.SVG_CONVERTER]: NAV_PATHS[ROUTE_KEYS.SVG_CONVERTER],
  [ROUTE_KEYS.GALAXY]: NAV_PATHS[ROUTE_KEYS.GALAXY],
  [ROUTE_KEYS.POSTS]: NAV_PATHS[ROUTE_KEYS.POSTS],
  [ROUTE_KEYS.MY_POSTS]: NAV_PATHS[ROUTE_KEYS.MY_POSTS]
};

export type ROUTES = ROUTE_KEYS;

export const NAV_PATH_LABELS: Record<ROUTE_KEYS, string> = {
  [ROUTE_KEYS.ROOT]: 'Home',
  [ROUTE_KEYS.CARD_GENERATOR]: 'Card Generator',
  [ROUTE_KEYS.SVG_CONVERTER]: 'SVG to PNG',
  [ROUTE_KEYS.GALAXY]: 'Galaxy',
  [ROUTE_KEYS.POSTS]: 'Posts',
  [ROUTE_KEYS.MY_POSTS]: 'My Posts',
  [ROUTE_KEYS.COINS]: 'Coins',
  [ROUTE_KEYS.GAME]: 'Game',
  [ROUTE_KEYS.SIGNIN]: 'Sign In',
  [ROUTE_KEYS.CALLBACK]: 'Callback',
  [ROUTE_KEYS.THREAD_BASE]: 'Thread',
  [ROUTE_KEYS.ADMIN]: 'Admin'
};

export const DISABLED_PATHS = [NAV_PATHS.GAME, NAV_PATHS.COINS];
export const PUBLIC_ROUTES = [
  NAV_PATHS.ROOT,
  NAV_PATHS.SIGNIN,
  NAV_PATHS.CARD_GENERATOR,
  NAV_PATHS.SVG_CONVERTER,
  NAV_PATHS.POSTS,
  '/auth/unlink-account'
];
export const PRIVATE_ROUTES = [NAV_PATHS.ADMIN, NAV_PATHS.MY_POSTS];
export const DEFAULT_REDIRECT = '/';
