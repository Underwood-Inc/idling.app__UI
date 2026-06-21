export interface IdRouteParams {
  id: string;
}

export interface UsernameRouteParams {
  username: string;
}

export interface IdRouteContext {
  params: Promise<IdRouteParams>;
}

export interface UsernameRouteContext {
  params: Promise<UsernameRouteParams>;
}
