'use client';

import React, { useEffect, useState } from 'react';
import './PWAInstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Note: Removed route-specific positioning logic as PWA prompt now uses
  // consistent top: 2rem; right: 2rem positioning regardless of route

  useEffect(() => {
    // Check if PWA is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (PWA is installed)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check for iOS Safari PWA
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }

      // Check if running in TWA (Trusted Web Activity)
      if (document.referrer.includes('android-app://')) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPromptEvent);
      setIsSupported(true);

      // Show prompt after a short delay to avoid being too aggressive
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user's response
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        // User accepted the install prompt
      } else {
        // User dismissed the install prompt
      }
    } catch (error) {
      // Error showing install prompt - fail silently
    } finally {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Hide for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed, not supported, or dismissed this session
  if (
    isInstalled ||
    !isSupported ||
    !showPrompt ||
    sessionStorage.getItem('pwa-prompt-dismissed')
  ) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-prompt__content">
        <div className="pwa-install-prompt__icon">📱</div>
        <div className="pwa-install-prompt__text">
          <span className="pwa-install-prompt__title">Install App</span>
          <span className="pwa-install-prompt__subtitle">
            Get the full experience
          </span>
        </div>
        <div className="pwa-install-prompt__actions">
          <button
            onClick={handleInstallClick}
            className="pwa-install-prompt__install-btn"
            aria-label="Install Idling App"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="pwa-install-prompt__dismiss-btn"
            aria-label="Dismiss install prompt"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
