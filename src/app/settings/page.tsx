'use client';

import { useSession } from 'next-auth/react';
import {
  useProfileVisibility,
  useUserPreferences
} from '../../lib/context/UserPreferencesContext';
import './settings.css';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const {
    spacingTheme,
    setSpacingTheme,
    paginationMode,
    setPaginationMode,
    emojiPanelBehavior,
    setEmojiPanelBehavior,
    fontPreference,
    setFontPreference,
    isUpdatingSpacingTheme,
    isUpdatingPaginationMode,
    isUpdatingEmojiPanelBehavior,
    isUpdatingFontPreference,
    spacingThemeError,
    paginationModeError,
    emojiPanelBehaviorError,
    fontPreferenceError
  } = useUserPreferences();

  const {
    visibility: profileVisibility,
    setVisibility: setProfileVisibility,
    isUpdating: isUpdatingProfileVisibility,
    error: profileVisibilityError
  } = useProfileVisibility();

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
          {/* Font Preference Section */}
          <div className="settings-group">
            <div className="settings-group__header">
              <h2 className="settings-group__title">Font Family</h2>
              <span className="settings-group__current">
                Current:{' '}
                <strong>
                  {fontPreference === 'monospace' ? 'Code' : 'Reading'}
                </strong>
              </span>
            </div>

            <div className="settings-options">
              <button
                className={`settings-option settings-option--monospace ${fontPreference === 'monospace' ? 'settings-option--active' : ''}`}
                onClick={() => setFontPreference('monospace')}
                disabled={isUpdatingFontPreference}
                aria-pressed={fontPreference === 'monospace'}
              >
                <span className="settings-option__icon">🔤</span>
                <span className="settings-option__label">Code</span>
                <span className="settings-option__desc">
                  Fira Code - Perfect for coding
                </span>
              </button>
              <button
                className={`settings-option settings-option--default ${fontPreference === 'default' ? 'settings-option--active' : ''}`}
                onClick={() => setFontPreference('default')}
                disabled={isUpdatingFontPreference}
                aria-pressed={fontPreference === 'default'}
              >
                <span className="settings-option__icon">📖</span>
                <span className="settings-option__label">Reading</span>
                <span className="settings-option__desc">
                  System fonts - Easy on the eyes
                </span>
              </button>
            </div>
            {fontPreferenceError && (
              <div className="settings-error">{fontPreferenceError}</div>
            )}
          </div>

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

          {/* Emoji Panel Behavior Section */}
          <div className="settings-group">
            <div className="settings-group__header">
              <h2 className="settings-group__title">Emoji Panel Behavior</h2>
              <span className="settings-group__current">
                Current:{' '}
                <strong>
                  {emojiPanelBehavior === 'close_after_select'
                    ? 'Close After Select'
                    : 'Stay Open'}
                </strong>
              </span>
            </div>

            <div className="settings-options">
              <button
                className={`settings-option settings-option--close-after ${emojiPanelBehavior === 'close_after_select' ? 'settings-option--active' : ''}`}
                onClick={() => setEmojiPanelBehavior('close_after_select')}
                disabled={isUpdatingEmojiPanelBehavior}
                aria-pressed={emojiPanelBehavior === 'close_after_select'}
              >
                <span className="settings-option__icon">🎯</span>
                <span className="settings-option__label">
                  Close After Select
                </span>
                <span className="settings-option__desc">
                  Panel closes after picking one emoji
                </span>
              </button>
              <button
                className={`settings-option settings-option--stay-open ${emojiPanelBehavior === 'stay_open' ? 'settings-option--active' : ''}`}
                onClick={() => setEmojiPanelBehavior('stay_open')}
                disabled={isUpdatingEmojiPanelBehavior}
                aria-pressed={emojiPanelBehavior === 'stay_open'}
              >
                <span className="settings-option__icon">📌</span>
                <span className="settings-option__label">Stay Open</span>
                <span className="settings-option__desc">
                  Pick multiple emojis before closing
                </span>
              </button>
            </div>
            {emojiPanelBehaviorError && (
              <div className="settings-error">{emojiPanelBehaviorError}</div>
            )}
          </div>

          {/* Profile Visibility Section - Only show for authenticated users */}
          {session?.user && (
            <div className="settings-group">
              <div className="settings-group__header">
                <h2 className="settings-group__title">Profile Visibility</h2>
                <span className="settings-group__current">
                  Current:{' '}
                  <strong>
                    {profileVisibility === 'public' ? 'Public' : 'Private'}
                  </strong>
                </span>
              </div>

              <div className="settings-options">
                <button
                  className={`settings-option settings-option--public ${profileVisibility === 'public' ? 'settings-option--active' : ''}`}
                  onClick={() => setProfileVisibility('public')}
                  disabled={isUpdatingProfileVisibility}
                  aria-pressed={profileVisibility === 'public'}
                >
                  <span className="settings-option__icon">🌐</span>
                  <span className="settings-option__label">Public</span>
                  <span className="settings-option__desc">
                    Profile visible to everyone
                  </span>
                </button>
                <button
                  className={`settings-option settings-option--private ${profileVisibility === 'private' ? 'settings-option--active' : ''}`}
                  onClick={() => setProfileVisibility('private')}
                  disabled={isUpdatingProfileVisibility}
                  aria-pressed={profileVisibility === 'private'}
                >
                  <span className="settings-option__icon">🔒</span>
                  <span className="settings-option__label">Private</span>
                  <span className="settings-option__desc">
                    Profile hidden from others
                  </span>
                </button>
              </div>
              {profileVisibilityError && (
                <div className="settings-error">{profileVisibilityError}</div>
              )}
            </div>
          )}

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
