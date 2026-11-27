import { isRadioPwaStartPath } from './isRadioPwaStartPath';

/** Edge proxy: HTML navigations with PWA context cookie must stay on the radio start path. */
export function shouldRedirectRadioPwaInstalledNavigation(
  pathname: string,
  hasPwaContextCookie: boolean
): boolean {
  if (!hasPwaContextCookie) {
    return false;
  }

  if (pathname.startsWith('/api/')) {
    return false;
  }

  return !isRadioPwaStartPath(pathname);
}