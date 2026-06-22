'use client';

import {
  RADIO_PWA_AUTO_PROMPT_SESSION_KEY,
  RADIO_PWA_INSTALL_PREPARE_TIMEOUT_MS,
  RADIO_PWA_INSTALL_READY_EVENT,
} from '@lib/radio-pwa/constants';
import type { PwaBeforeInstallPromptEvent } from '@lib/radio-pwa/installPrompt';
import {
  ensureRadioPwaInstallPromptListener,
  getRadioPwaDeferredPrompt,
  subscribeRadioPwaInstallPrompt,
} from '@lib/radio-pwa/installPrompt';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

function shouldAutoPromptAfterReload(): boolean {
  return sessionStorage.getItem(RADIO_PWA_AUTO_PROMPT_SESSION_KEY) === '1';
}

export function RadioPwaInstallButton() {
  const [hasPrompt, setHasPrompt] = useState(false);
  const [installIntent, setInstallIntent] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [awaitingPrompt, setAwaitingPrompt] = useState(false);
  const autoPromptAttemptedRef = useRef(false);

  const runInstallPrompt = useCallback(async (deferredPrompt: PwaBeforeInstallPromptEvent) => {
    sessionStorage.removeItem(RADIO_PWA_AUTO_PROMPT_SESSION_KEY);
    setAwaitingPrompt(false);

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
  }, []);

  const tryAutoPrompt = useCallback(() => {
    if (autoPromptAttemptedRef.current || !shouldAutoPromptAfterReload()) {
      return;
    }

    const deferredPrompt = getRadioPwaDeferredPrompt();
    if (!deferredPrompt) {
      return;
    }

    autoPromptAttemptedRef.current = true;
    void runInstallPrompt(deferredPrompt);
  }, [runInstallPrompt]);

  useLayoutEffect(() => {
    ensureRadioPwaInstallPromptListener();
    setHasPrompt(getRadioPwaDeferredPrompt() !== null);
  }, []);

  useEffect(() => {
    if (isStandalonePwa() || isRadioPwaInstalled()) {
      setHidden(true);
      return undefined;
    }

    let intentActive = isRadioPwaInstallIntentActive();

    if (intentActive && !shouldAutoPromptAfterReload()) {
      clearRadioPwaInstallIntentState();
      intentActive = false;
    }

    setInstallIntent(intentActive);
    setHidden(false);

    if (intentActive) {
      setRadioPwaInstallIntent();
      setRadioPwaManifestLink();
      setAwaitingPrompt(getRadioPwaDeferredPrompt() === null);
      tryAutoPrompt();
    }

    const unsubscribe = subscribeRadioPwaInstallPrompt((prompt) => {
      setHasPrompt(prompt !== null);
      if (prompt) {
        setAwaitingPrompt(false);
        tryAutoPrompt();
      }
    });

    const onInstallReady = () => {
      setHasPrompt(getRadioPwaDeferredPrompt() !== null);
      setAwaitingPrompt(false);
      tryAutoPrompt();
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
  }, [tryAutoPrompt]);

  useEffect(() => {
    if (!awaitingPrompt || hasPrompt) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      clearRadioPwaInstallIntentState();
      setInstallIntent(false);
      setAwaitingPrompt(false);
      setHasPrompt(false);
      autoPromptAttemptedRef.current = false;
    }, RADIO_PWA_INSTALL_PREPARE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [awaitingPrompt, hasPrompt]);

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
