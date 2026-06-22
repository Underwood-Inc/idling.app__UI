'use client';

import { RADIO_PWA_INSTALL_READY_EVENT } from '@lib/radio-pwa/constants';
import type { PwaBeforeInstallPromptEvent } from '@lib/radio-pwa/installPrompt';
import {
  ensureRadioPwaInstallPromptListener,
  getRadioPwaDeferredPrompt,
  subscribeRadioPwaInstallPrompt,
} from '@lib/radio-pwa/installPrompt';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  isRadioPwaInstalled,
  isStandalonePwa,
  markRadioPwaInstalled,
  setRadioPwaManifestLink,
} from './radioPwaAccess';
import styles from './RadioPwaInstallButton.module.css';

export function RadioPwaInstallButton() {
  const [hasPrompt, setHasPrompt] = useState(false);

  const runInstallPrompt = useCallback(async (deferredPrompt: PwaBeforeInstallPromptEvent) => {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      markRadioPwaInstalled();
    }
  }, []);

  useLayoutEffect(() => {
    if (isStandalonePwa() || isRadioPwaInstalled()) {
      return;
    }

    setRadioPwaManifestLink();
    ensureRadioPwaInstallPromptListener();
    setHasPrompt(getRadioPwaDeferredPrompt() !== null);
  }, []);

  useEffect(() => {
    if (isStandalonePwa() || isRadioPwaInstalled()) {
      return undefined;
    }

    setRadioPwaManifestLink();
    ensureRadioPwaInstallPromptListener();

    const unsubscribe = subscribeRadioPwaInstallPrompt((prompt) => {
      setHasPrompt(prompt !== null);
    });

    const onInstallReady = () => {
      setHasPrompt(getRadioPwaDeferredPrompt() !== null);
    };

    const onAppInstalled = () => {
      markRadioPwaInstalled();
      setHasPrompt(false);
    };

    window.addEventListener(RADIO_PWA_INSTALL_READY_EVENT, onInstallReady);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      unsubscribe();
      window.removeEventListener(RADIO_PWA_INSTALL_READY_EVENT, onInstallReady);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isStandalonePwa() || isRadioPwaInstalled() || !hasPrompt) {
    return null;
  }

  const handleClick = () => {
    const deferredPrompt = getRadioPwaDeferredPrompt();
    if (!deferredPrompt) {
      return;
    }

    void runInstallPrompt(deferredPrompt);
  };

  return (
    <button
      type="button"
      className={`${styles.install} no-glass`}
      aria-label="Install Idling Radio app"
      onClick={handleClick}
    >
      <SiteIcon id="download" sizeRem={0.9} title="" />
      <span className={styles.install__label}>Install</span>
    </button>
  );
}
