const ROOT = '/';
const GALAXY = 'https://galaxy.idling.app/';
const POSTS = '/posts';
const MY_POSTS = '/my-posts';
const COINS = '/coins';
const GAME = '/game';
const SIGNIN = '/auth/signin';

export const NAV_PATHS = {
  ROOT,
  GALAXY,
  POSTS,
  MY_POSTS,
  COINS,
  GAME,
  SIGNIN
};

export const HEADER_NAV_PATHS: Record<
  Exclude<ROUTES, 'ROOT' | 'SIGNIN' | 'COINS' | 'GAME'>,
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
  SIGNIN: 'Sign In'
};

export const DISABLED_PATHS = [NAV_PATHS.GAME];
export const PUBLIC_ROUTES = [NAV_PATHS.ROOT, NAV_PATHS.SIGNIN];
export const DEFAULT_REDIRECT = '/posts';
