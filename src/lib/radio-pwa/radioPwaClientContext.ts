import { isStandalonePwa } from './isStandalonePwa';

/** Tags `<html>` for standalone PWA styles only — no cookies, reloads, or redirects. */
export function syncRadioPwaDomContext(): void {
  if (isStandalonePwa()) {
    document.documentElement.dataset.radioPwa = 'standalone';
    return;
  }

  delete document.documentElement.dataset.radioPwa;
}
