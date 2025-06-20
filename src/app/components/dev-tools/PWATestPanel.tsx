'use client';

import React, { useEffect, useState } from 'react';

const PWATestPanel: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState('checking...');

  useEffect(() => {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    // Check for iOS Safari PWA
    if ((window.navigator as any).standalone === true) {
      setIsStandalone(true);
    }

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          setServiceWorkerStatus('active');
        })
        .catch(() => {
          setServiceWorkerStatus('error');
        });
    } else {
      setServiceWorkerStatus('not supported');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = () => {
      setInstallPromptAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const testInstallPrompt = () => {
    // Force show install prompt for testing
    const event = new CustomEvent('beforeinstallprompt');
    window.dispatchEvent(event);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <div
        style={{
          padding: '20px',
          background: 'var(--light-background--primary)',
          borderRadius: '12px',
          border: '1px solid var(--light-border--primary)'
        }}
      >
        <h2>PWA & Animated Border Test Panel</h2>

        <div style={{ marginBottom: '20px' }}>
          <h3>PWA Status</h3>
          <ul>
            <li>
              Running as PWA: <strong>{isStandalone ? 'Yes' : 'No'}</strong>
            </li>
            <li>
              Install prompt available:{' '}
              <strong>{installPromptAvailable ? 'Yes' : 'No'}</strong>
            </li>
            <li>
              Service Worker: <strong>{serviceWorkerStatus}</strong>
            </li>
          </ul>

          <button
            onClick={testInstallPrompt}
            style={{
              padding: '8px 16px',
              background: 'var(--brand-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Test Install Prompt
          </button>
        </div>

        <div>
          <h3>PWA Features</h3>
          <ul>
            <li>✅ Web App Manifest</li>
            <li>✅ Service Worker with caching</li>
            <li>✅ Install prompt component</li>
            <li>✅ Offline support</li>
            <li>✅ App icons (multiple sizes)</li>
            <li>✅ Theme colors</li>
            <li>✅ Standalone display mode</li>
            <li>✅ App shortcuts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PWATestPanel;
