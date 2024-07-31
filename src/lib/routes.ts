const ROOT = '/';
const POSTS = '/posts';
const COINS = '/coins';
const GAME = '/game';
const SIGNIN = '/auth/signin';

export const NAV_PATHS = {
  ROOT,
  POSTS,
  COINS,
  GAME,
  SIGNIN
};

export const HEADER_NAV_PATHS: Record<
  Exclude<ROUTES, 'ROOT' | 'SIGNIN'>,
  string
> = {
  COINS,
  GAME,
  POSTS
};

export type ROUTES = keyof typeof NAV_PATHS;

export const NAV_PATH_LABELS: Record<ROUTES, string> = {
  ROOT: 'Home',
  POSTS: 'Posts',
  COINS: 'Coins',
  GAME: 'Game',
  SIGNIN: 'Sign In'
};

export const DISABLED_PATHS = [NAV_PATHS.GAME];
export const PUBLIC_ROUTES = [NAV_PATHS.ROOT, NAV_PATHS.SIGNIN];
export const DEFAULT_REDIRECT = '/posts';
