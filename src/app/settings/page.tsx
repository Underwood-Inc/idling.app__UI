'use client';

import { useSession } from 'next-auth/react';
import { useUserPreferences } from '../../lib/context/UserPreferencesContext';
import './settings.css';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const {
    spacingTheme,
    setSpacingTheme,
    paginationMode,
    setPaginationMode,
    isUpdatingSpacingTheme,
    isUpdatingPaginationMode,
    spacingThemeError,
    paginationModeError
  } = useUserPreferences();

  if (status === 'loading') {
    return (
      <div className="settings-page">
        <div className="settings-page__loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page__container">
        <div className="settings-page__header">
          <h1 className="settings-page__title">Settings</h1>
          <p className="settings-page__description">
            Configure your site-wide preferences
          </p>
        </div>

        <div className="settings-page__content">
          {/* Spacing Theme Section */}
          <div className="settings-group">
            <div className="settings-group__header">
              <h2 className="settings-group__title">Display Density</h2>
              <span className="settings-group__current">
                Current:{' '}
                <strong>{spacingTheme === 'cozy' ? 'Cozy' : 'Compact'}</strong>
              </span>
            </div>

            <div className="settings-options">
              <button
                className={`settings-option settings-option--cozy ${spacingTheme === 'cozy' ? 'settings-option--active' : ''}`}
                onClick={() => setSpacingTheme('cozy')}
                disabled={isUpdatingSpacingTheme}
                aria-pressed={spacingTheme === 'cozy'}
              >
                <span className="settings-option__icon">📖</span>
                <span className="settings-option__label">Cozy</span>
                <span className="settings-option__desc">
                  More spacing, easier to read
                </span>
              </button>
              <button
                className={`settings-option settings-option--compact ${spacingTheme === 'compact' ? 'settings-option--active' : ''}`}
                onClick={() => setSpacingTheme('compact')}
                disabled={isUpdatingSpacingTheme}
                aria-pressed={spacingTheme === 'compact'}
              >
                <span className="settings-option__icon">📊</span>
                <span className="settings-option__label">Compact</span>
                <span className="settings-option__desc">
                  Less spacing, more content
                </span>
              </button>
            </div>
            {spacingThemeError && (
              <div className="settings-error">{spacingThemeError}</div>
            )}
          </div>

          {/* Pagination Mode Section */}
          <div className="settings-group">
            <div className="settings-group__header">
              <h2 className="settings-group__title">Page Navigation</h2>
              <span className="settings-group__current">
                Current:{' '}
                <strong>
                  {paginationMode === 'traditional'
                    ? 'Traditional'
                    : 'Infinite Scroll'}
                </strong>
              </span>
            </div>

            <div className="settings-options">
              <button
                className={`settings-option settings-option--traditional ${paginationMode === 'traditional' ? 'settings-option--active' : ''}`}
                onClick={() => setPaginationMode('traditional')}
                disabled={isUpdatingPaginationMode}
                aria-pressed={paginationMode === 'traditional'}
              >
                <span className="settings-option__icon">📄</span>
                <span className="settings-option__label">Traditional</span>
                <span className="settings-option__desc">
                  Page numbers with next/previous
                </span>
              </button>
              <button
                className={`settings-option settings-option--infinite ${paginationMode === 'infinite' ? 'settings-option--active' : ''}`}
                onClick={() => setPaginationMode('infinite')}
                disabled={isUpdatingPaginationMode}
                aria-pressed={paginationMode === 'infinite'}
              >
                <span className="settings-option__icon">∞</span>
                <span className="settings-option__label">Infinite Scroll</span>
                <span className="settings-option__desc">
                  Auto-load content as you scroll
                </span>
              </button>
            </div>
            {paginationModeError && (
              <div className="settings-error">{paginationModeError}</div>
            )}
          </div>

          {/* Account Status */}
          <div className="settings-group settings-group--info">
            <div className="settings-account">
              {session?.user ? (
                <div className="settings-account__content">
                  <span className="settings-account__icon">✅</span>
                  <div>
                    <div className="settings-account__status">
                      Signed in as{' '}
                      <strong>{session.user.name || session.user.email}</strong>
                    </div>
                    <div className="settings-account__note">
                      Settings sync across devices
                    </div>
                  </div>
                </div>
              ) : (
                <div className="settings-account__content">
                  <span className="settings-account__icon">⚠️</span>
                  <div>
                    <div className="settings-account__status">
                      <strong>Not signed in</strong>
                    </div>
                    <div className="settings-account__note">
                      Settings saved locally only
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
