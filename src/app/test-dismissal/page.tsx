'use client';

import { useEffect, useState } from 'react';

export default function TestDismissalPage() {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [bannerDebug, setBannerDebug] = useState<any>(null);

  useEffect(() => {
    // Load current dismissed alerts
    const loadDismissedAlerts = () => {
      try {
        const dismissed = JSON.parse(
          localStorage.getItem('dismissedAlerts') || '[]'
        );
        setDismissedAlerts(dismissed);
      } catch (error) {
        setDismissedAlerts([]);
      }
    };

    loadDismissedAlerts();

    // Check banner debug info
    const checkBannerDebug = () => {
      if (typeof window !== 'undefined' && (window as any).__bannerDebug) {
        setBannerDebug((window as any).__bannerDebug());
      }
    };

    checkBannerDebug();
    const interval = setInterval(() => {
      loadDismissedAlerts();
      checkBannerDebug();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const clearDismissedAlerts = () => {
    if (
      typeof window !== 'undefined' &&
      (window as any).__clearDismissedAlerts
    ) {
      const result = (window as any).__clearDismissedAlerts();
      alert(result);
    } else {
      localStorage.removeItem('dismissedAlerts');
      setDismissedAlerts([]);
      // Manually refresh banners
      window.dispatchEvent(new CustomEvent('refresh-alerts'));
    }
  };

  const refreshBanners = () => {
    if (typeof window !== 'undefined' && (window as any).__refreshBanners) {
      (window as any).__refreshBanners();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Banner Dismissal Test Page</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>📋 Instructions</h2>
        <ol>
          <li>
            Make sure you're <strong>not logged in</strong> (anonymous user)
          </li>
          <li>Look for the welcome banner at the top of the page</li>
          <li>Click the "✕" button to dismiss it</li>
          <li>Refresh the page - the banner should stay dismissed</li>
          <li>
            Use the "Clear Dismissed Alerts" button to reset and see the banner
            again
          </li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>🔧 Controls</h2>
        <button
          onClick={refreshBanners}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Banners
        </button>
        <button
          onClick={clearDismissedAlerts}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear Dismissed Alerts
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>📊 Current State</h2>
        <div
          style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        >
          <strong>Dismissed Alerts in localStorage:</strong>
          <pre>{JSON.stringify(dismissedAlerts, null, 2)}</pre>

          {bannerDebug && (
            <>
              <strong>Banner System Debug:</strong>
              <pre>{JSON.stringify(bannerDebug, null, 2)}</pre>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>✅ Expected Behavior</h2>
        <ul>
          <li>
            <strong>When anonymous:</strong> Dismissing banners stores alert IDs
            in localStorage
          </li>
          <li>
            <strong>On page refresh:</strong> Dismissed banners don't appear
            again
          </li>
          <li>
            <strong>When authenticated:</strong> Dismissals are stored in
            database instead
          </li>
          <li>
            <strong>localStorage cleanup:</strong> Old dismissals are
            automatically cleaned up
          </li>
        </ul>
      </div>

      <div
        style={{
          background: '#e7f3ff',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px'
        }}
      >
        <h3>🎯 Test Scenario</h3>
        <p>
          The welcome banner "Welcome to the Enhanced Alert System! 🎉" should
          be dismissible for anonymous users and stay dismissed across page
          reloads using localStorage caching.
        </p>
      </div>
    </div>
  );
}
