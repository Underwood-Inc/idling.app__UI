import {
  IDLING_RADIO_PWA_START_PATH,
} from './constants';
import { isStandalonePwa } from './isStandalonePwa';
import { isRadioPwaStartPath } from './isRadioPwaStartPath';
import {
  buildClearRadioPwaContextCookieAttribute,
  buildRadioPwaContextCookieAttribute,
} from './radioPwaContextCookie';

function writeDocumentCookie(attribute: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    document.cookie = attribute;
  } catch {
    // Cookie writes must not block shell bootstrap.
  }
}

export function setRadioPwaContextClientCookie(): void {
  writeDocumentCookie(buildRadioPwaContextCookieAttribute());
}

export function clearRadioPwaContextClientCookie(): void {
  writeDocumentCookie(buildClearRadioPwaContextCookieAttribute());
}

/** Hard navigation — required when SW or SSR already rendered a non-radio document. */
export function redirectRadioPwaToStartIfNeeded(pathname?: string): boolean {
  if (typeof window === 'undefined' || !isStandalonePwa()) {
    return false;
  }

  const currentPath = pathname ?? window.location.pathname;
  if (isRadioPwaStartPath(currentPath)) {
    return false;
  }

  const target =
    IDLING_RADIO_PWA_START_PATH + window.location.search + window.location.hash;

  window.location.replace(target);
  return true;
}

/**
 * Standalone display mode: tag DOM, persist PWA cookie, enforce start URL.
 * Browser tab: strip PWA cookie so the site does not server-redirect normal visits.
 */
export function applyRadioPwaClientSession(pathname?: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (isStandalonePwa()) {
    document.documentElement.dataset.radioPwa = 'standalone';
    setRadioPwaContextClientCookie();

    if (redirectRadioPwaToStartIfNeeded(pathname)) {
      return;
    }

    return;
  }

  delete document.documentElement.dataset.radioPwa;
  clearRadioPwaContextClientCookie();
}