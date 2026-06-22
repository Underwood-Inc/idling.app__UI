import {
  IDLING_RADIO_PWA_START_PATH,
  RADIO_PWA_INSTALLED_STORAGE_KEY,
  RADIO_PWA_MANIFEST_HREF,
} from '@lib/radio-pwa/constants';
import { clearRadioPwaInstallPrompt } from '@lib/radio-pwa/installPrompt';

export { IDLING_RADIO_PWA_START_PATH as RADIO_PWA_START_PATH };

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  if (navigatorWithStandalone.standalone === true) {
    return true;
  }

  if (document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
}

export function isRadioPwaInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(RADIO_PWA_INSTALLED_STORAGE_KEY) === '1';
}

export function markRadioPwaInstalled(): void {
  localStorage.setItem(RADIO_PWA_INSTALLED_STORAGE_KEY, '1');
  clearRadioPwaInstallPrompt();
  restoreMainSiteManifestLink();
}

export function setRadioPwaManifestLink(): void {
  if (typeof document === 'undefined') {
    return;
  }

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }

  link.href = RADIO_PWA_MANIFEST_HREF;
}

export function restoreMainSiteManifestLink(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (link) {
    link.href = '/manifest.json';
  }
}
