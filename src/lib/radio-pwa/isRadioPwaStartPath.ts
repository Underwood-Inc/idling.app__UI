import { IDLING_RADIO_PWA_START_PATH } from './constants';

/** Document path is the installed radio PWA entry (manifest `start_url`). */
export function isRadioPwaStartPath(pathname: string): boolean {
  if (pathname === IDLING_RADIO_PWA_START_PATH) {
    return true;
  }

  return (
    IDLING_RADIO_PWA_START_PATH !== '/' &&
    pathname === `${IDLING_RADIO_PWA_START_PATH}/`
  );
}