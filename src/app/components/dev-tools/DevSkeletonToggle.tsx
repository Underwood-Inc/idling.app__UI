/**
 * DevSkeletonToggle - Development-only skeleton state controller
 *
 * This component is ONLY included in development builds and provides
 * global control over skeleton loading states for testing and development.
 *
 * SECURITY NOTE: This entire file is excluded from production builds
 * via Next.js build-time environment variable checks.
 */

'use client';

import { atom, useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import './DevSkeletonToggle.css';

// Global dev skeleton state atoms - always defined but only used in development
const devSkeletonModeAtom = atom<'auto' | 'force-on' | 'force-off'>('auto');
const devSkeletonEnabledAtom = atom<boolean>(false);

// Hook for components to check if they should show skeleton
export const useDevSkeletonState = () => {
  const [mode] = useAtom(devSkeletonModeAtom);
  const [isEnabled] = useAtom(devSkeletonEnabledAtom);

  if (process.env.NODE_ENV !== 'development') {
    return {
      shouldShowSkeleton: false,
      isDevModeActive: false
    };
  }

  return {
    shouldShowSkeleton: mode === 'force-on',
    isDevModeActive: isEnabled && mode !== 'auto'
  };
};

// Internal component that's only rendered in development
const DevSkeletonToggleInternal: React.FC = () => {
  const [mode, setMode] = useAtom(devSkeletonModeAtom);
  const [, setIsEnabled] = useAtom(devSkeletonEnabledAtom);
  const [isVisible, setIsVisible] = useState(false);

  // Get dev mode state
  const { isDevModeActive } = useDevSkeletonState();

  // Keyboard shortcut to toggle visibility (Ctrl+Shift+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleModeChange = (newMode: 'auto' | 'force-on' | 'force-off') => {
    setMode(newMode);
    setIsEnabled(newMode !== 'auto');

    // Development logging with visual indicators
    if (process.env.NODE_ENV === 'development') {
      const modeEmojis = {
        auto: '🔵',
        'force-on': '🟢',
        'force-off': '🔴'
      };
      // eslint-disable-next-line no-console
      console.log(
        `🎛️ [DEV SKELETON] ${modeEmojis[newMode]} Mode changed to:`,
        newMode.toUpperCase()
      );

      // Add temporary visual feedback
      const existingToast = document.querySelector('.dev-skeleton-toast');
      if (existingToast) {
        existingToast.remove();
      }

      const toast = document.createElement('div');
      toast.className = 'dev-skeleton-toast';
      toast.innerHTML = `${modeEmojis[newMode]} Skeleton: ${newMode.toUpperCase()}`;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #2563eb;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideDown 0.3s ease;
      `;

      // Add slide animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(toast);

      // Remove after 2 seconds
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'slideDown 0.3s ease reverse';
          setTimeout(() => toast.remove(), 300);
        }
        style.remove();
      }, 2000);
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'auto':
        return 'Normal behavior - skeletons show during actual loading';
      case 'force-on':
        return 'Force ON - all components show skeleton state';
      case 'force-off':
        return 'Force OFF - no skeletons will show (override loading states)';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`dev-skeleton-toggle-fab ${isVisible ? 'dev-skeleton-toggle-fab--open' : ''}`}
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle skeleton dev tools (Ctrl+Shift+S)"
        aria-label="Open skeleton development tools"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        {isDevModeActive && (
          <div className="dev-skeleton-toggle-fab__indicator" />
        )}
      </button>

      {/* Control panel */}
      {isVisible && (
        <div className="dev-skeleton-toggle-panel">
          <div className="dev-skeleton-toggle-panel__header">
            <h3>🎛️ Skeleton Dev Tools</h3>
            <button
              className="dev-skeleton-toggle-panel__close"
              onClick={() => setIsVisible(false)}
              aria-label="Close skeleton dev tools"
            >
              ×
            </button>
          </div>

          <div className="dev-skeleton-toggle-panel__content">
            <div className="dev-skeleton-toggle-panel__section">
              <h4>Mode Control</h4>
              <div className="dev-skeleton-toggle-panel__radio-group">
                <label className="dev-skeleton-toggle-panel__radio">
                  <input
                    type="radio"
                    name="skeleton-mode"
                    value="auto"
                    checked={mode === 'auto'}
                    onChange={() => handleModeChange('auto')}
                  />
                  <span>Auto (Default)</span>
                </label>

                <label className="dev-skeleton-toggle-panel__radio">
                  <input
                    type="radio"
                    name="skeleton-mode"
                    value="force-on"
                    checked={mode === 'force-on'}
                    onChange={() => handleModeChange('force-on')}
                  />
                  <span>Force ON</span>
                </label>

                <label className="dev-skeleton-toggle-panel__radio">
                  <input
                    type="radio"
                    name="skeleton-mode"
                    value="force-off"
                    checked={mode === 'force-off'}
                    onChange={() => handleModeChange('force-off')}
                  />
                  <span>Force OFF</span>
                </label>
              </div>
            </div>

            <div className="dev-skeleton-toggle-panel__section">
              <h4>Current Status</h4>
              <div className="dev-skeleton-toggle-panel__status">
                <div
                  className={`dev-skeleton-toggle-panel__status-indicator ${isDevModeActive ? 'active' : 'inactive'}`}
                >
                  {isDevModeActive ? '🟢 Override Active' : '🔵 Normal Mode'}
                </div>
                <p className="dev-skeleton-toggle-panel__description">
                  {getModeDescription()}
                </p>
              </div>
            </div>

            <div className="dev-skeleton-toggle-panel__section">
              <h4>Usage</h4>
              <ul className="dev-skeleton-toggle-panel__help">
                <li>
                  <strong>Auto:</strong> Normal loading behavior
                </li>
                <li>
                  <strong>Force ON:</strong> See skeleton designs without
                  waiting for loading
                </li>
                <li>
                  <strong>Force OFF:</strong> Test layouts without skeleton
                  interference
                </li>
                <li>
                  <strong>Keyboard:</strong> Ctrl+Shift+S to toggle this panel
                </li>
              </ul>
            </div>

            <div className="dev-skeleton-toggle-panel__section">
              <div className="dev-skeleton-toggle-panel__warning">
                ⚠️ <strong>Development Only</strong>
                <br />
                This tool is automatically excluded from production builds.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Main component with build-time exclusion
export const DevSkeletonToggle: React.FC = () => {
  // Return null in production - this ensures the component doesn't exist
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <DevSkeletonToggleInternal />;
};

export default DevSkeletonToggle;
