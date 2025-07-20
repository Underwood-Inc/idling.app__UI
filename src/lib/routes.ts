const ROOT = '/';
const CARD_GENERATOR = '/card-generator';
const SVG_CONVERTER = '/svg-converter';
const GALAXY = 'https://galaxy.idling.app/';
const POSTS = '/posts';
const MY_POSTS = '/my-posts';
const COINS = '/coins';
const GAME = '/game';
const SIGNIN = '/auth/signin';
const CALLBACK = '/auth/callback';
const ADMIN = '/admin';

// Thread routes for Reddit-style navigation
const THREAD_BASE = '/t';

export const NAV_PATHS = {
  ROOT,
  CARD_GENERATOR,
  SVG_CONVERTER,
  GALAXY,
  POSTS,
  MY_POSTS,
  COINS,
  GAME,
  SIGNIN,
  CALLBACK,
  THREAD_BASE,
  ADMIN
};

// Helper function to build thread URLs
export const buildThreadUrl = (submissionId: number) =>
  `${THREAD_BASE}/${submissionId}`;

// Check if a URL is external
export const isExternalLink = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

// Navigation groups for better organization
export const NAV_GROUPS = {
  TOOLS: {
    label: 'Tools',
    items: ['CARD_GENERATOR', 'SVG_CONVERTER'] as const
  },
  CONTENT: {
    label: 'Content',
    items: ['POSTS', 'MY_POSTS'] as const
  },
  EXTERNAL: {
    label: 'External',
    items: ['GALAXY'] as const
  }
} as const;

export const HEADER_NAV_PATHS: Record<
  Exclude<
    ROUTES,
    'ROOT' | 'SIGNIN' | 'COINS' | 'GAME' | 'THREAD_BASE' | 'ADMIN' | 'CALLBACK'
  >,
  string
> = {
  CARD_GENERATOR,
  SVG_CONVERTER,
  GALAXY,
  POSTS,
  MY_POSTS
};

export type ROUTES = keyof typeof NAV_PATHS;

export const NAV_PATH_LABELS: Record<ROUTES, string> = {
  ROOT: 'Home',
  CARD_GENERATOR: 'Card Generator',
  SVG_CONVERTER: 'SVG to PNG',
  GALAXY: 'Galaxy',
  POSTS: 'Posts',
  MY_POSTS: 'My Posts',
  COINS: 'Coins',
  GAME: 'Game',
  SIGNIN: 'Sign In',
  CALLBACK: 'Callback',
  THREAD_BASE: 'Thread',
  ADMIN: 'Admin'
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
