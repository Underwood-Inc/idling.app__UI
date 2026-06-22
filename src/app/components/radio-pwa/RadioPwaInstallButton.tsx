'use client';

import { RADIO_PWA_INSTALL_OFFER_WAIT_MS, RADIO_PWA_INSTALL_READY_EVENT } from '@lib/radio-pwa/constants';
import type { PwaBeforeInstallPromptEvent } from '@lib/radio-pwa/installPrompt';
import {
  ensureRadioPwaInstallPromptListener,
  getRadioPwaDeferredPrompt,
  subscribeRadioPwaInstallPrompt,
} from '@lib/radio-pwa/installPrompt';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
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
  const [offerUnavailable, setOfferUnavailable] = useState(false);

  const runInstallPrompt = useCallback(async (deferredPrompt: PwaBeforeInstallPromptEvent) => {
    setOfferUnavailable(false);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        markRadioPwaInstalled();
        setHidden(true);
        return;
      }

      clearRadioPwaInstallIntentState();
      setInstallIntent(false);
      setHasPrompt(false);
    } catch {
      setOfferUnavailable(true);
    }
  }, []);

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
    setOfferUnavailable(false);

    if (intentActive) {
      setRadioPwaInstallIntent();
      setRadioPwaManifestLink();
    }

    const unsubscribe = subscribeRadioPwaInstallPrompt((prompt) => {
      setHasPrompt(prompt !== null);
      if (prompt) {
        setOfferUnavailable(false);
      }
    });

    const onInstallReady = () => {
      setHasPrompt(getRadioPwaDeferredPrompt() !== null);
      setOfferUnavailable(false);
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

  useEffect(() => {
    if (!installIntent || hasPrompt) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setOfferUnavailable(true);
    }, RADIO_PWA_INSTALL_OFFER_WAIT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasPrompt, installIntent]);

  if (hidden) {
    return null;
  }

  const handleClick = () => {
    const deferredPrompt = getRadioPwaDeferredPrompt();
    if (deferredPrompt) {
      void runInstallPrompt(deferredPrompt);
      return;
    }

    if (!installIntent) {
      beginRadioPwaInstallFlow();
      return;
    }

    setOfferUnavailable(true);
  };

  const label = hasPrompt ? 'Install' : installIntent && offerUnavailable ? 'Retry install' : 'Install';
  const title = hasPrompt
    ? 'Install Idling Radio'
    : installIntent
      ? offerUnavailable
        ? 'Browser did not offer install yet — click to retry, or use the browser menu.'
        : 'Loading install offer — click again in a moment'
      : 'Install Idling Radio (prepares the radio app, then click again)';

  return (
    <button
      type="button"
      className={`${styles.install} no-glass`}
      aria-label={title}
      title={title}
      onClick={handleClick}
    >
      <SiteIcon id="download" sizeRem={0.9} title="" />
      <span className={styles.install__label}>{label}</span>
    </button>
  );
}
