import {
  IDLING_RADIO_PWA_MANIFEST_ID,
  IDLING_RADIO_PWA_START_PATH,
} from './constants';
import type {
  RadioPwaInstallCapability,
  RadioPwaInstallResult,
} from './installRadioPwa.types';
import {
  getRadioPwaDeferredPrompt,
  type PwaBeforeInstallPromptEvent,
} from './installPrompt';
import type { NavigatorWithInstall } from './navigatorInstall.types';

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  const isIosDevice = /iPad|iPhone|iPod/.test(ua);
  const isMsStream = 'MSStream' in window;

  return isIosDevice && !isMsStream;
}

export function isWebInstallApiAvailable(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return typeof (navigator as NavigatorWithInstall).install === 'function';
}

export function isChromiumBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /Chrome|Chromium|Edg/i.test(navigator.userAgent);
}

export function shouldOfferRadioPwaInstallUi(): boolean {
  if (getRadioPwaInstallCapability().canOfferInstall) {
    return true;
  }

  return isChromiumBrowser();
}

export function getRadioPwaInstallCapability(): RadioPwaInstallCapability {
  if (isWebInstallApiAvailable()) {
    return { canOfferInstall: true, preferredMethod: 'web-install-api' };
  }

  if (getRadioPwaDeferredPrompt() !== null) {
    return { canOfferInstall: true, preferredMethod: 'before-install-prompt' };
  }

  if (isIosSafari()) {
    return { canOfferInstall: true, preferredMethod: 'ios-manual' };
  }

  return { canOfferInstall: false, preferredMethod: null };
}

async function installViaWebInstallApi(): Promise<RadioPwaInstallResult> {
  const navigatorWithInstall = navigator as NavigatorWithInstall;
  const install = navigatorWithInstall.install;

  if (typeof install !== 'function') {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    await install(IDLING_RADIO_PWA_START_PATH, IDLING_RADIO_PWA_MANIFEST_ID);
    return { ok: true, method: 'web-install-api' };
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    const message = error instanceof Error ? error.message : String(error);

    if (name === 'AbortError') {
      return { ok: false, reason: 'dismissed', message };
    }

    if (name === 'DataError') {
      return {
        ok: false,
        reason: 'manifest-error',
        message: message || 'The radio manifest could not be parsed.',
      };
    }

    return { ok: false, reason: 'unsupported', message };
  }
}

async function installViaBeforeInstallPrompt(
  deferredPrompt: PwaBeforeInstallPromptEvent
): Promise<RadioPwaInstallResult> {
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      return { ok: true, method: 'before-install-prompt' };
    }

    return { ok: false, reason: 'dismissed' };
  } catch {
    return { ok: false, reason: 'aborted' };
  }
}

/**
 * Installs the Idling Radio PWA from the site control bar without navigating
 * the current tab. Primary path: Web Install API background document install.
 */
export async function installRadioPwa(): Promise<RadioPwaInstallResult> {
  if (isWebInstallApiAvailable()) {
    const webInstallResult = await installViaWebInstallApi();
    if (webInstallResult.ok) {
      return webInstallResult;
    }

    if (webInstallResult.reason !== 'unsupported') {
      return webInstallResult;
    }
  }

  const deferredPrompt = getRadioPwaDeferredPrompt();
  if (deferredPrompt) {
    return installViaBeforeInstallPrompt(deferredPrompt);
  }

  if (isIosSafari()) {
    return {
      ok: false,
      reason: 'no-method',
      manualHint: 'ios-add-to-home-screen',
    };
  }

  return { ok: false, reason: 'no-method' };
}

export const IOS_ADD_TO_HOME_SCREEN_HINT =
  'To install Idling Radio on iOS, tap Share, then Add to Home Screen.';
