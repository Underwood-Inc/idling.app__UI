const ROOT = '/';
const GALAXY = 'https://galaxy.idling.app/';
const POSTS = '/posts';
const MY_POSTS = '/my-posts';
const COINS = '/coins';
const GAME = '/game';
const SIGNIN = '/auth/signin';
const ADMIN = '/admin';

// Thread routes for Reddit-style navigation
const THREAD_BASE = '/t';

export const NAV_PATHS = {
  ROOT,
  GALAXY,
  POSTS,
  MY_POSTS,
  COINS,
  GAME,
  SIGNIN,
  THREAD_BASE,
  ADMIN
};

// Helper function to build thread URLs
export const buildThreadUrl = (submissionId: number) =>
  `${THREAD_BASE}/${submissionId}`;

export const HEADER_NAV_PATHS: Record<
  Exclude<
    ROUTES,
    'ROOT' | 'SIGNIN' | 'COINS' | 'GAME' | 'THREAD_BASE' | 'ADMIN'
  >,
  string
> = {
  GALAXY,
  POSTS,
  MY_POSTS
};

export type ROUTES = keyof typeof NAV_PATHS;

export const NAV_PATH_LABELS: Record<ROUTES, string> = {
  ROOT: 'Home',
  GALAXY: 'Galaxy',
  POSTS: 'Posts',
  MY_POSTS: 'My Posts',
  COINS: 'Coins',
  GAME: 'Game',
  SIGNIN: 'Sign In',
  THREAD_BASE: 'Thread',
  ADMIN: 'Admin'
};

export const DISABLED_PATHS = [NAV_PATHS.GAME, NAV_PATHS.COINS];
export const PUBLIC_ROUTES = [NAV_PATHS.ROOT, NAV_PATHS.SIGNIN];
export const PRIVATE_ROUTES = [
  NAV_PATHS.ADMIN,
  NAV_PATHS.MY_POSTS,
  NAV_PATHS.POSTS
];
export const DEFAULT_REDIRECT = '/';
