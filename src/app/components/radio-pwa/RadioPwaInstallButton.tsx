'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useEffect, useState } from 'react';
import {
  beginRadioPwaInstallFlow,
  clearRadioPwaInstallIntent,
  isRadioPwaInstallIntentActive,
  isRadioPwaInstalled,
  isStandalonePwa,
  markRadioPwaInstalled,
  setRadioPwaManifestLink,
} from './radioPwaAccess';
import styles from './RadioPwaInstallButton.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function RadioPwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installIntent, setInstallIntent] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalonePwa() || isRadioPwaInstalled()) {
      setHidden(true);
      return undefined;
    }

    const intentActive = isRadioPwaInstallIntentActive();
    setInstallIntent(intentActive);
    setHidden(false);

    if (intentActive) {
      setRadioPwaManifestLink();
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      markRadioPwaInstalled();
      setDeferredPrompt(null);
      setHidden(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (hidden) {
    return null;
  }

  const handleClick = () => {
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
          clearRadioPwaInstallIntent();
          setInstallIntent(false);
        }
      })();
      return;
    }

    beginRadioPwaInstallFlow();
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
