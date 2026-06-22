'use client';

import { RADIO_PWA_INSTALL_READY_EVENT } from '@lib/radio-pwa/constants';
import {
  ensureRadioPwaInstallPromptListener,
  getRadioPwaDeferredPrompt,
  subscribeRadioPwaInstallPrompt,
} from '@lib/radio-pwa/installPrompt';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  beginRadioPwaInstallFlow,
  clearRadioPwaInstallIntentState,
  isRadioPwaInstallIntentActive,
  isRadioPwaInstalled,
  isStandalonePwa,
  markRadioPwaInstalled,
  setRadioPwaManifestLink,
} from './radioPwaAccess';
import { setRadioPwaInstallIntent } from '@lib/radio-pwa/intent';
import styles from './RadioPwaInstallButton.module.css';

export function RadioPwaInstallButton() {
  const [hasPrompt, setHasPrompt] = useState(false);
  const [installIntent, setInstallIntent] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [awaitingPrompt, setAwaitingPrompt] = useState(false);

  useLayoutEffect(() => {
    ensureRadioPwaInstallPromptListener();
    setHasPrompt(getRadioPwaDeferredPrompt() !== null);
  }, []);

  useEffect(() => {
    if (isStandalonePwa() || isRadioPwaInstalled()) {
      setHidden(true);
      return undefined;
    }

    const intentActive = isRadioPwaInstallIntentActive();
    setInstallIntent(intentActive);
    setHidden(false);

    if (intentActive) {
      setRadioPwaInstallIntent();
      setRadioPwaManifestLink();
      setAwaitingPrompt(getRadioPwaDeferredPrompt() === null);
    }

    const unsubscribe = subscribeRadioPwaInstallPrompt((prompt) => {
      setHasPrompt(prompt !== null);
      if (prompt) {
        setAwaitingPrompt(false);
      }
    });

    const onInstallReady = () => {
      setHasPrompt(getRadioPwaDeferredPrompt() !== null);
      setAwaitingPrompt(false);
    };

    const onAppInstalled = () => {
      markRadioPwaInstalled();
      setHidden(true);
    };

    window.addEventListener(RADIO_PWA_INSTALL_READY_EVENT, onInstallReady);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      unsubscribe();
      window.removeEventListener(RADIO_PWA_INSTALL_READY_EVENT, onInstallReady);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (hidden) {
    return null;
  }

  const handleClick = () => {
    const deferredPrompt = getRadioPwaDeferredPrompt();
    if (deferredPrompt) {
      void (async () => {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          markRadioPwaInstalled();
          setHidden(true);
          return;
        }

        if (installIntent) {
          clearRadioPwaInstallIntentState();
          setInstallIntent(false);
          setAwaitingPrompt(false);
        }
      })();
      return;
    }

    if (!installIntent) {
      beginRadioPwaInstallFlow();
      return;
    }

    setAwaitingPrompt(true);
  };

  const isWaiting = awaitingPrompt && installIntent && !hasPrompt;

  return (
    <button
      type="button"
      className={`${styles.install} no-glass`}
      aria-label={isWaiting ? 'Preparing Idling Radio install' : 'Install Idling Radio app'}
      aria-busy={isWaiting}
      disabled={isWaiting}
      onClick={handleClick}
    >
      <SiteIcon id="download" sizeRem={0.9} title="" />
      <span className={styles.install__label}>{isWaiting ? 'Preparing…' : 'Install'}</span>
    </button>
  );
}
