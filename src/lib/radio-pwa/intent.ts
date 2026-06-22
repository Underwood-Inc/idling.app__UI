import {
  RADIO_PWA_INSTALL_INTENT_COOKIE,
  RADIO_PWA_INSTALL_INTENT_STORAGE_KEY,
} from './constants';

export function isRadioPwaInstallIntentActive(): boolean {
  if (typeof document !== 'undefined') {
    if (document.cookie.split('; ').some((entry) => entry === `${RADIO_PWA_INSTALL_INTENT_COOKIE}=1`)) {
      return true;
    }
  }

  if (typeof window !== 'undefined') {
    return localStorage.getItem(RADIO_PWA_INSTALL_INTENT_STORAGE_KEY) === '1';
  }

  return false;
}

export function setRadioPwaInstallIntent(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${RADIO_PWA_INSTALL_INTENT_COOKIE}=1; path=/; max-age=86400; SameSite=Lax`;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(RADIO_PWA_INSTALL_INTENT_STORAGE_KEY, '1');
  }
}

export function clearRadioPwaInstallIntent(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${RADIO_PWA_INSTALL_INTENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(RADIO_PWA_INSTALL_INTENT_STORAGE_KEY);
  }
}

export function readRadioInstallIntentCookie(cookieValue: string | undefined): boolean {
  return cookieValue === '1';
}
