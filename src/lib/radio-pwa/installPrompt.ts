import { RADIO_PWA_INSTALL_READY_EVENT, RADIO_PWA_MANIFEST_HREF } from './constants';
import { isRadioPwaInstallIntentActive } from './intent';

export interface PwaBeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface WindowWithRadioInstallPrompt extends Window {
  __idlingRadioDeferredPrompt?: PwaBeforeInstallPromptEvent;
  __idlingRadioInstallListenerRegistered?: boolean;
}

let deferredPrompt: PwaBeforeInstallPromptEvent | null = null;

const subscribers = new Set<(prompt: PwaBeforeInstallPromptEvent | null) => void>();

function readEarlyPrompt(): PwaBeforeInstallPromptEvent | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return (window as WindowWithRadioInstallPrompt).__idlingRadioDeferredPrompt ?? null;
}

export function isRadioPwaManifestActive(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href ?? '';
  return href.includes(RADIO_PWA_MANIFEST_HREF) || href.includes('idling-radio.webmanifest');
}

export function shouldCaptureRadioInstallPrompt(): boolean {
  return isRadioPwaInstallIntentActive() || isRadioPwaManifestActive();
}

export function getRadioPwaDeferredPrompt(): PwaBeforeInstallPromptEvent | null {
  return readEarlyPrompt() ?? deferredPrompt;
}

export function subscribeRadioPwaInstallPrompt(
  listener: (prompt: PwaBeforeInstallPromptEvent | null) => void
): () => void {
  subscribers.add(listener);
  listener(getRadioPwaDeferredPrompt());

  return () => {
    subscribers.delete(listener);
  };
}

function notifySubscribers(): void {
  const prompt = getRadioPwaDeferredPrompt();
  subscribers.forEach((listener) => {
    listener(prompt);
  });
}

export function captureRadioPwaInstallPrompt(event: PwaBeforeInstallPromptEvent): void {
  deferredPrompt = event;

  if (typeof window !== 'undefined') {
    (window as WindowWithRadioInstallPrompt).__idlingRadioDeferredPrompt = event;
    window.dispatchEvent(new CustomEvent(RADIO_PWA_INSTALL_READY_EVENT));
  }

  notifySubscribers();
}

export function clearRadioPwaInstallPrompt(): void {
  deferredPrompt = null;

  if (typeof window !== 'undefined') {
    delete (window as WindowWithRadioInstallPrompt).__idlingRadioDeferredPrompt;
  }

  notifySubscribers();
}

export function ensureRadioPwaInstallPromptListener(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const windowWithListener = window as WindowWithRadioInstallPrompt;
  if (windowWithListener.__idlingRadioInstallListenerRegistered) {
    return;
  }

  windowWithListener.__idlingRadioInstallListenerRegistered = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    if (!shouldCaptureRadioInstallPrompt()) {
      return;
    }

    event.preventDefault();
    captureRadioPwaInstallPrompt(event as PwaBeforeInstallPromptEvent);
  });
}

/** Inline script — registers before React hydrates when the radio manifest is active. */
export const RADIO_PWA_INSTALL_EARLY_CAPTURE_SCRIPT = `(function(){function c(){return document.cookie.indexOf("idling-radio-pwa-install-intent=1")!==-1}function m(){var l=document.querySelector('link[rel="manifest"]');return l&&l.href.indexOf("idling-radio")!==-1}function ok(){return c()||m()}if(!ok())return;window.addEventListener("beforeinstallprompt",function(e){if(!ok())return;e.preventDefault();window.__idlingRadioDeferredPrompt=e;window.dispatchEvent(new CustomEvent("idling-radio-install-ready"));});})();`;
