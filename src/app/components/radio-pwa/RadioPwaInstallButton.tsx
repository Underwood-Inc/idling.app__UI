'use client';

import { RADIO_PWA_INSTALL_READY_EVENT } from '@lib/radio-pwa/constants';
import {
  getRadioPwaInstallCapability,
  installRadioPwa,
  IOS_ADD_TO_HOME_SCREEN_HINT,
  shouldOfferRadioPwaInstallUi,
} from '@lib/radio-pwa/installRadioPwa';
import {
  ensureRadioPwaInstallPromptListener,
  getRadioPwaDeferredPrompt,
  subscribeRadioPwaInstallPrompt,
} from '@lib/radio-pwa/installPrompt';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useCallback, useEffect, useState } from 'react';
import {
  isRadioPwaInstalled,
  isStandalonePwa,
  markRadioPwaInstalled,
} from './radioPwaAccess';
import styles from './RadioPwaInstallButton.module.css';

export function RadioPwaInstallButton() {
  const [canOfferInstall, setCanOfferInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshCapability = useCallback(() => {
    setCanOfferInstall(shouldOfferRadioPwaInstallUi());
  }, []);

  useEffect(() => {
    if (isStandalonePwa() || isRadioPwaInstalled()) {
      return undefined;
    }

    ensureRadioPwaInstallPromptListener();
    refreshCapability();

    const unsubscribe = subscribeRadioPwaInstallPrompt(() => {
      refreshCapability();
    });

    const onInstallReady = () => {
      refreshCapability();
    };

    const onAppInstalled = () => {
      markRadioPwaInstalled();
      setCanOfferInstall(false);
      setStatusMessage(null);
    };

    window.addEventListener(RADIO_PWA_INSTALL_READY_EVENT, onInstallReady);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      unsubscribe();
      window.removeEventListener(RADIO_PWA_INSTALL_READY_EVENT, onInstallReady);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [refreshCapability]);

  if (isStandalonePwa() || isRadioPwaInstalled() || !canOfferInstall) {
    return null;
  }

  const handleClick = async () => {
    if (isInstalling) {
      return;
    }

    setStatusMessage(null);
    setIsInstalling(true);

    try {
      const result = await installRadioPwa();

      if (result.ok) {
        markRadioPwaInstalled();
        return;
      }

      if (result.manualHint === 'ios-add-to-home-screen') {
        setStatusMessage(IOS_ADD_TO_HOME_SCREEN_HINT);
        return;
      }

      if (result.reason === 'dismissed') {
        return;
      }

      if (getRadioPwaDeferredPrompt() === null && !getRadioPwaInstallCapability().canOfferInstall) {
        setStatusMessage(
          'Radio install needs Chrome or Edge with the Web Install API enabled for idling.app.'
        );
      }
    } finally {
      setIsInstalling(false);
      refreshCapability();
    }
  };

  return (
    <span className={styles.installWrap}>
      <button
        type="button"
        className={`${styles.install} no-glass`}
        aria-label="Install Idling Radio app"
        aria-busy={isInstalling}
        disabled={isInstalling}
        onClick={() => {
          void handleClick();
        }}
      >
        <SiteIcon id="download" sizeRem={0.9} title="" />
        <span className={styles.install__label}>{isInstalling ? 'Installing…' : 'Install'}</span>
      </button>
      {statusMessage ? (
        <span className={styles.install__hint} role="status">
          {statusMessage}
        </span>
      ) : null}
    </span>
  );
}
