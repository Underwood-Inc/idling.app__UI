import { IDLING_RADIO_PWA_START_PATH } from '@lib/radio-pwa/constants';

export { IDLING_RADIO_PWA_START_PATH as RADIO_PWA_START_PATH };

export const RADIO_PWA_MANIFEST_HREF = '/idling-radio.webmanifest';
export const RADIO_PWA_INSTALLED_STORAGE_KEY = 'idling-radio-pwa-installed';
export const RADIO_PWA_INSTALL_INTENT_STORAGE_KEY = 'idling-radio-pwa-install-intent';

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

export function isRadioPwaInstallIntentActive(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(RADIO_PWA_INSTALL_INTENT_STORAGE_KEY) === '1';
}

export function markRadioPwaInstalled(): void {
  localStorage.setItem(RADIO_PWA_INSTALLED_STORAGE_KEY, '1');
  localStorage.removeItem(RADIO_PWA_INSTALL_INTENT_STORAGE_KEY);
  restoreMainSiteManifestLink();
}

export function clearRadioPwaInstallIntent(): void {
  localStorage.removeItem(RADIO_PWA_INSTALL_INTENT_STORAGE_KEY);
  restoreMainSiteManifestLink();
}

export function beginRadioPwaInstallFlow(): void {
  localStorage.setItem(RADIO_PWA_INSTALL_INTENT_STORAGE_KEY, '1');
  setRadioPwaManifestLink();
  window.location.reload();
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
