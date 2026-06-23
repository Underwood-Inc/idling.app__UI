import { RADIO_PWA_INSTALL_READY_EVENT, RADIO_PWA_MANIFEST_HREF } from './constants';

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
    if (!isRadioPwaManifestActive()) {
      return;
    }

    event.preventDefault();
    captureRadioPwaInstallPrompt(event as PwaBeforeInstallPromptEvent);
  });
}
