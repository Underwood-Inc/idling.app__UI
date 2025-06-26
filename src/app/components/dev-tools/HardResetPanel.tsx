'use client';

import { createLogger } from '@/lib/logging';
import React, { useEffect, useState } from 'react';
import {
  getResetStats,
  HardResetResult,
  triggerManualHardReset
} from '../../../lib/utils/hard-reset-manager';

const logger = createLogger({
  context: {
    component: 'HardResetPanel',
    module: 'components/dev-tools'
  },
  enabled: false
});

const HardResetPanel: React.FC = () => {
  const [resetStats, setResetStats] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [lastResetResult, setLastResetResult] =
    useState<HardResetResult | null>(null);

  const loadResetStats = () => {
    const stats = getResetStats();
    setResetStats(stats);
  };

  useEffect(() => {
    loadResetStats();

    // Refresh stats every 5 seconds
    const interval = setInterval(loadResetStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualReset = async (reason: string) => {
    if (isResetting) return;

    setIsResetting(true);
    try {
      const result = await triggerManualHardReset(reason);
      setLastResetResult(result);

      // Refresh stats after reset
      setTimeout(() => {
        loadResetStats();
        setIsResetting(false);

        // Reload page if reset was successful
        if (result.resetPerformed) {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }, 1000);
    } catch (error) {
      logger.error('Manual reset failed', error as Error);
      setIsResetting(false);
    }
  };

  const triggerBrowserReset = () => {
    if (window.confirm('This will trigger a complete hard reset. Continue?')) {
      handleManualReset('Manual browser reset via admin panel');
    }
  };

  const triggerTestReset = () => {
    if (window.confirm('This will trigger a test reset. Continue?')) {
      handleManualReset('Test reset for development');
    }
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        marginBottom: '1rem'
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
        🔄 Hard Reset Management
      </h3>

      {/* Reset Statistics */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
          📊 Reset Statistics
        </h4>
        {resetStats ? (
          <div
            style={{
              backgroundColor: '#fff',
              padding: '0.75rem',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <div>
              <strong>Last Reset Version:</strong>{' '}
              {resetStats.lastResetVersion || 'None'}
            </div>
            <div>
              <strong>Last Reset Time:</strong>{' '}
              {formatTimestamp(resetStats.lastResetTimestamp)}
            </div>
            <div>
              <strong>Total Resets:</strong> {resetStats.resetCount}
            </div>
            <div>
              <strong>First Visit:</strong>{' '}
              {formatTimestamp(resetStats.firstVisit)}
            </div>
          </div>
        ) : (
          <div>Loading stats...</div>
        )}
      </div>

      {/* Last Reset Result */}
      {lastResetResult && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
            📋 Last Reset Result
          </h4>
          <div
            style={{
              backgroundColor: lastResetResult.resetPerformed
                ? '#d4edda'
                : '#f8d7da',
              padding: '0.75rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              border: `1px solid ${lastResetResult.resetPerformed ? '#c3e6cb' : '#f5c6cb'}`
            }}
          >
            <div>
              <strong>Reset Performed:</strong>{' '}
              {lastResetResult.resetPerformed ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Previous Version:</strong>{' '}
              {lastResetResult.previousVersion || 'None'}
            </div>
            <div>
              <strong>Current Version:</strong> {lastResetResult.currentVersion}
            </div>

            {lastResetResult.resetPerformed && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Items Cleared:</strong>
                <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                  <li>
                    Service Workers:{' '}
                    {lastResetResult.itemsCleared.serviceWorkers}
                  </li>
                  <li>Caches: {lastResetResult.itemsCleared.caches}</li>
                  <li>
                    localStorage:{' '}
                    {lastResetResult.itemsCleared.localStorage ? '✅' : '❌'}
                  </li>
                  <li>
                    sessionStorage:{' '}
                    {lastResetResult.itemsCleared.sessionStorage ? '✅' : '❌'}
                  </li>
                  <li>
                    IndexedDB:{' '}
                    {lastResetResult.itemsCleared.indexedDB ? '✅' : '❌'}
                  </li>
                  <li>Cookies: {lastResetResult.itemsCleared.cookies}</li>
                  <li>
                    WebSQL: {lastResetResult.itemsCleared.webSQL ? '✅' : '❌'}
                  </li>
                </ul>
              </div>
            )}

            {lastResetResult.errors.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Errors:</strong>
                <ul
                  style={{
                    margin: '0.25rem 0',
                    paddingLeft: '1.5rem',
                    color: '#721c24'
                  }}
                >
                  {lastResetResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset Actions */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
          🔧 Reset Actions
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={triggerBrowserReset}
            disabled={isResetting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isResetting ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isResetting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {isResetting ? 'Resetting...' : '🔄 Manual Hard Reset'}
          </button>

          <button
            onClick={triggerTestReset}
            disabled={isResetting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isResetting ? '#6c757d' : '#ffc107',
              color: isResetting ? 'white' : '#212529',
              border: 'none',
              borderRadius: '4px',
              cursor: isResetting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {isResetting ? 'Resetting...' : '🧪 Test Reset'}
          </button>

          <button
            onClick={loadResetStats}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🔄 Refresh Stats
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          fontSize: '0.75rem',
          color: '#6c757d',
          backgroundColor: '#e9ecef',
          padding: '0.5rem',
          borderRadius: '4px'
        }}
      >
        <strong>Console Commands:</strong>
        <br />• <code>triggerHardReset(&apos;reason&apos;)</code> - Trigger
        manual reset
        <br />• <code>window.__originalConsole.log(&apos;test&apos;)</code> -
        Use original console in production
      </div>
    </div>
  );
};

export default HardResetPanel;
