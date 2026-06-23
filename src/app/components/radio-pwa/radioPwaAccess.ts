import { RADIO_PWA_INSTALLED_STORAGE_KEY } from '@lib/radio-pwa/constants';
import { clearRadioPwaInstallPrompt } from '@lib/radio-pwa/installPrompt';

export { IDLING_RADIO_PWA_START_PATH as RADIO_PWA_START_PATH } from '@lib/radio-pwa/constants';

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
}
