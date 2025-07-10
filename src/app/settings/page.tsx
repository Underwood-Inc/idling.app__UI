'use client';

import { useSession } from 'next-auth/react';
import React, { useState } from 'react';
import {
  useProfileVisibility,
  useUserPreferences
} from '../../lib/context/UserPreferencesContext';
import './settings.css';

interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  expanded: boolean;
}

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
    accessibilityFocusMode,
    setAccessibilityFocusMode,
    backgroundMovementDirection,
    setBackgroundMovementDirection,
    backgroundMovementSpeed,
    setBackgroundMovementSpeed,
    backgroundAnimationLayers,
    setBackgroundAnimationLayers,
    isUpdatingSpacingTheme,
    isUpdatingPaginationMode,
    isUpdatingEmojiPanelBehavior,
    isUpdatingFontPreference,
    isUpdatingAccessibilityFocusMode,
    isUpdatingBackgroundMovementDirection,
    isUpdatingBackgroundMovementSpeed,
    isUpdatingBackgroundAnimationLayers,
    spacingThemeError,
    paginationModeError,
    emojiPanelBehaviorError,
    fontPreferenceError,
    accessibilityFocusModeError,
    backgroundMovementDirectionError,
    backgroundMovementSpeedError,
    backgroundAnimationLayersError
  } = useUserPreferences();

  const {
    visibility: profileVisibility,
    setVisibility: setProfileVisibility,
    isUpdating: isUpdatingProfileVisibility,
    error: profileVisibilityError
  } = useProfileVisibility();

  // Category expansion state
  const [categories, setCategories] = useState<SettingsCategory[]>([
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize how the site looks and feels',
      icon: '🎨',
      expanded: true
    },
    {
      id: 'behavior',
      title: 'Behavior',
      description: 'Control how the site behaves and responds',
      icon: '⚙️',
      expanded: true
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      description: 'Make the site easier to use for everyone',
      icon: '♿',
      expanded: true
    },
    {
      id: 'background',
      title: 'Background Effects',
      description: 'Customize the animated space background',
      icon: '🌌',
      expanded: true
    },
    {
      id: 'privacy',
      title: 'Privacy & Profile',
      description: 'Control your profile visibility and data',
      icon: '🔒',
      expanded: session?.user ? true : false
    }
  ]);

  const toggleCategory = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
      )
    );
  };

  if (status === 'loading') {
    return (
      <div className="settings-page">
        <div className="settings-page__loading">
          <div className="loading-spinner"></div>
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page__container">
        <div className="settings-page__header">
          <h1 className="settings-page__title">Settings</h1>
          <p className="settings-page__description">
            Customize your experience and preferences
          </p>
        </div>

        <div className="settings-page__content">
          {/* Appearance Category */}
          <div className="settings-category">
            <button
              className="settings-category__header"
              onClick={() => toggleCategory('appearance')}
              aria-expanded={
                categories.find((c) => c.id === 'appearance')?.expanded
              }
            >
              <div className="settings-category__header-content">
                <span className="settings-category__icon">🎨</span>
                <div className="settings-category__header-text">
                  <h2 className="settings-category__title">Appearance</h2>
                  <p className="settings-category__description">
                    Customize how the site looks and feels
                  </p>
                </div>
              </div>
              <span className="settings-category__toggle">
                {categories.find((c) => c.id === 'appearance')?.expanded
                  ? '−'
                  : '+'}
              </span>
            </button>

            {categories.find((c) => c.id === 'appearance')?.expanded && (
              <div className="settings-category__content">
                <div className="settings-grid">
                  {/* Font Preference */}
                  <div className="settings-card">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">Font Family</h3>
                      <span className="settings-card__current">
                        {fontPreference === 'monospace' ? 'Code' : 'Reading'}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${fontPreference === 'monospace' ? 'settings-option--active' : ''}`}
                        onClick={() => setFontPreference('monospace')}
                        disabled={isUpdatingFontPreference}
                        aria-pressed={fontPreference === 'monospace'}
                      >
                        <span className="settings-option__icon">🔤</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Code</span>
                          <span className="settings-option__desc">
                            Fira Code - Perfect for coding
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${fontPreference === 'default' ? 'settings-option--active' : ''}`}
                        onClick={() => setFontPreference('default')}
                        disabled={isUpdatingFontPreference}
                        aria-pressed={fontPreference === 'default'}
                      >
                        <span className="settings-option__icon">📖</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Reading
                          </span>
                          <span className="settings-option__desc">
                            System fonts - Easy on the eyes
                          </span>
                        </div>
                      </button>
                    </div>
                    {fontPreferenceError && (
                      <div className="settings-card__error">
                        {fontPreferenceError}
                      </div>
                    )}
                  </div>

                  {/* Display Density */}
                  <div className="settings-card">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">Display Density</h3>
                      <span className="settings-card__current">
                        {spacingTheme === 'cozy' ? 'Cozy' : 'Compact'}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${spacingTheme === 'cozy' ? 'settings-option--active' : ''}`}
                        onClick={() => setSpacingTheme('cozy')}
                        disabled={isUpdatingSpacingTheme}
                        aria-pressed={spacingTheme === 'cozy'}
                      >
                        <span className="settings-option__icon">📖</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Cozy</span>
                          <span className="settings-option__desc">
                            More spacing, easier to read
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${spacingTheme === 'compact' ? 'settings-option--active' : ''}`}
                        onClick={() => setSpacingTheme('compact')}
                        disabled={isUpdatingSpacingTheme}
                        aria-pressed={spacingTheme === 'compact'}
                      >
                        <span className="settings-option__icon">📊</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Compact
                          </span>
                          <span className="settings-option__desc">
                            Less spacing, more content
                          </span>
                        </div>
                      </button>
                    </div>
                    {spacingThemeError && (
                      <div className="settings-card__error">
                        {spacingThemeError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Behavior Category */}
          <div className="settings-category">
            <button
              className="settings-category__header"
              onClick={() => toggleCategory('behavior')}
              aria-expanded={
                categories.find((c) => c.id === 'behavior')?.expanded
              }
            >
              <div className="settings-category__header-content">
                <span className="settings-category__icon">⚙️</span>
                <div className="settings-category__header-text">
                  <h2 className="settings-category__title">Behavior</h2>
                  <p className="settings-category__description">
                    Control how the site behaves and responds
                  </p>
                </div>
              </div>
              <span className="settings-category__toggle">
                {categories.find((c) => c.id === 'behavior')?.expanded
                  ? '−'
                  : '+'}
              </span>
            </button>

            {categories.find((c) => c.id === 'behavior')?.expanded && (
              <div className="settings-category__content">
                <div className="settings-grid">
                  {/* Page Navigation */}
                  <div className="settings-card">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">Page Navigation</h3>
                      <span className="settings-card__current">
                        {paginationMode === 'traditional'
                          ? 'Traditional'
                          : 'Infinite Scroll'}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${paginationMode === 'traditional' ? 'settings-option--active' : ''}`}
                        onClick={() => setPaginationMode('traditional')}
                        disabled={isUpdatingPaginationMode}
                        aria-pressed={paginationMode === 'traditional'}
                      >
                        <span className="settings-option__icon">📄</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Traditional
                          </span>
                          <span className="settings-option__desc">
                            Page numbers with next/previous
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${paginationMode === 'infinite' ? 'settings-option--active' : ''}`}
                        onClick={() => setPaginationMode('infinite')}
                        disabled={isUpdatingPaginationMode}
                        aria-pressed={paginationMode === 'infinite'}
                      >
                        <span className="settings-option__icon">∞</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Infinite Scroll
                          </span>
                          <span className="settings-option__desc">
                            Auto-load content as you scroll
                          </span>
                        </div>
                      </button>
                    </div>
                    {paginationModeError && (
                      <div className="settings-card__error">
                        {paginationModeError}
                      </div>
                    )}
                  </div>

                  {/* Emoji Panel Behavior */}
                  <div className="settings-card">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">Emoji Panel</h3>
                      <span className="settings-card__current">
                        {emojiPanelBehavior === 'close_after_select'
                          ? 'Close After Select'
                          : 'Stay Open'}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${emojiPanelBehavior === 'close_after_select' ? 'settings-option--active' : ''}`}
                        onClick={() =>
                          setEmojiPanelBehavior('close_after_select')
                        }
                        disabled={isUpdatingEmojiPanelBehavior}
                        aria-pressed={
                          emojiPanelBehavior === 'close_after_select'
                        }
                      >
                        <span className="settings-option__icon">🎯</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Close After Select
                          </span>
                          <span className="settings-option__desc">
                            Panel closes after picking one emoji
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${emojiPanelBehavior === 'stay_open' ? 'settings-option--active' : ''}`}
                        onClick={() => setEmojiPanelBehavior('stay_open')}
                        disabled={isUpdatingEmojiPanelBehavior}
                        aria-pressed={emojiPanelBehavior === 'stay_open'}
                      >
                        <span className="settings-option__icon">📌</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Stay Open
                          </span>
                          <span className="settings-option__desc">
                            Pick multiple emojis before closing
                          </span>
                        </div>
                      </button>
                    </div>
                    {emojiPanelBehaviorError && (
                      <div className="settings-card__error">
                        {emojiPanelBehaviorError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accessibility Category */}
          <div className="settings-category">
            <button
              className="settings-category__header"
              onClick={() => toggleCategory('accessibility')}
              aria-expanded={
                categories.find((c) => c.id === 'accessibility')?.expanded
              }
            >
              <div className="settings-category__header-content">
                <span className="settings-category__icon">♿</span>
                <div className="settings-category__header-text">
                  <h2 className="settings-category__title">Accessibility</h2>
                  <p className="settings-category__description">
                    Make the site easier to use for everyone
                  </p>
                </div>
              </div>
              <span className="settings-category__toggle">
                {categories.find((c) => c.id === 'accessibility')?.expanded
                  ? '−'
                  : '+'}
              </span>
            </button>

            {categories.find((c) => c.id === 'accessibility')?.expanded && (
              <div className="settings-category__content">
                <div className="settings-grid">
                  {/* Accessibility Focus */}
                  <div className="settings-card">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">Focus Indicators</h3>
                      <span className="settings-card__current">
                        {accessibilityFocusMode === 'enabled'
                          ? 'Enabled'
                          : 'Disabled'}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${accessibilityFocusMode === 'disabled' ? 'settings-option--active' : ''}`}
                        onClick={() => setAccessibilityFocusMode('disabled')}
                        disabled={isUpdatingAccessibilityFocusMode}
                        aria-pressed={accessibilityFocusMode === 'disabled'}
                      >
                        <span className="settings-option__icon">🎯</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Disabled
                          </span>
                          <span className="settings-option__desc">
                            Clean visual design without focus outlines
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${accessibilityFocusMode === 'enabled' ? 'settings-option--active' : ''}`}
                        onClick={() => setAccessibilityFocusMode('enabled')}
                        disabled={isUpdatingAccessibilityFocusMode}
                        aria-pressed={accessibilityFocusMode === 'enabled'}
                      >
                        <span className="settings-option__icon">🔍</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Enabled
                          </span>
                          <span className="settings-option__desc">
                            Show focus outlines for keyboard navigation
                          </span>
                        </div>
                      </button>
                    </div>
                    {accessibilityFocusModeError && (
                      <div className="settings-card__error">
                        {accessibilityFocusModeError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Background Effects Category */}
          <div className="settings-category">
            <button
              className="settings-category__header"
              onClick={() => toggleCategory('background')}
              aria-expanded={
                categories.find((c) => c.id === 'background')?.expanded
              }
            >
              <div className="settings-category__header-content">
                <span className="settings-category__icon">🌌</span>
                <div className="settings-category__header-text">
                  <h2 className="settings-category__title">
                    Background Effects
                  </h2>
                  <p className="settings-category__description">
                    Customize the animated space background
                  </p>
                </div>
              </div>
              <span className="settings-category__toggle">
                {categories.find((c) => c.id === 'background')?.expanded
                  ? '−'
                  : '+'}
              </span>
            </button>

            {categories.find((c) => c.id === 'background')?.expanded && (
              <div className="settings-category__content">
                <div className="settings-grid">
                  {/* Movement Direction */}
                  <div className="settings-card">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">
                        Movement Direction
                      </h3>
                      <span className="settings-card__current">
                        {backgroundMovementDirection === 'static'
                          ? 'Static'
                          : backgroundMovementDirection === 'forward'
                            ? 'Forward'
                            : backgroundMovementDirection === 'backward'
                              ? 'Backward'
                              : backgroundMovementDirection === 'left'
                                ? 'Left'
                                : backgroundMovementDirection === 'right'
                                  ? 'Right'
                                  : backgroundMovementDirection === 'up'
                                    ? 'Up'
                                    : 'Down'}
                      </span>
                    </div>
                    <div className="settings-card__options settings-card__options--grid">
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'static' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('static')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'static'}
                      >
                        <span className="settings-option__icon">⏸️</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Static</span>
                          <span className="settings-option__desc">
                            No movement
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'forward' ? 'settings-option--active' : ''}`}
                        onClick={() =>
                          setBackgroundMovementDirection('forward')
                        }
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'forward'}
                      >
                        <span className="settings-option__icon">⬆️</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Forward
                          </span>
                          <span className="settings-option__desc">
                            Flying ahead
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'backward' ? 'settings-option--active' : ''}`}
                        onClick={() =>
                          setBackgroundMovementDirection('backward')
                        }
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={
                          backgroundMovementDirection === 'backward'
                        }
                      >
                        <span className="settings-option__icon">⬇️</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            Backward
                          </span>
                          <span className="settings-option__desc">
                            Pulling back
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'left' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('left')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'left'}
                      >
                        <span className="settings-option__icon">⬅️</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Left</span>
                          <span className="settings-option__desc">
                            Drift left
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'right' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('right')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'right'}
                      >
                        <span className="settings-option__icon">➡️</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Right</span>
                          <span className="settings-option__desc">
                            Drift right
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'up' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('up')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'up'}
                      >
                        <span className="settings-option__icon">⬆️</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Up</span>
                          <span className="settings-option__desc">
                            Drift up
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'down' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('down')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'down'}
                      >
                        <span className="settings-option__icon">⬇️</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Down</span>
                          <span className="settings-option__desc">
                            Drift down
                          </span>
                        </div>
                      </button>
                    </div>
                    {backgroundMovementDirectionError && (
                      <div className="settings-card__error">
                        {backgroundMovementDirectionError}
                      </div>
                    )}
                  </div>

                  {/* Movement Speed */}
                  <div className="settings-card">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">Movement Speed</h3>
                      <span className="settings-card__current">
                        {backgroundMovementSpeed === 'slow'
                          ? 'Slow'
                          : backgroundMovementSpeed === 'normal'
                            ? 'Normal'
                            : 'Fast'}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${backgroundMovementSpeed === 'slow' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementSpeed('slow')}
                        disabled={isUpdatingBackgroundMovementSpeed}
                        aria-pressed={backgroundMovementSpeed === 'slow'}
                      >
                        <span className="settings-option__icon">🐢</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Slow</span>
                          <span className="settings-option__desc">
                            Relaxed pace
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementSpeed === 'normal' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementSpeed('normal')}
                        disabled={isUpdatingBackgroundMovementSpeed}
                        aria-pressed={backgroundMovementSpeed === 'normal'}
                      >
                        <span className="settings-option__icon">🚀</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Normal</span>
                          <span className="settings-option__desc">
                            Standard speed
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementSpeed === 'fast' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementSpeed('fast')}
                        disabled={isUpdatingBackgroundMovementSpeed}
                        aria-pressed={backgroundMovementSpeed === 'fast'}
                      >
                        <span className="settings-option__icon">⚡</span>
                        <div className="settings-option__content">
                          <span className="settings-option__label">Fast</span>
                          <span className="settings-option__desc">
                            High speed
                          </span>
                        </div>
                      </button>
                    </div>
                    {backgroundMovementSpeedError && (
                      <div className="settings-card__error">
                        {backgroundMovementSpeedError}
                      </div>
                    )}
                  </div>

                  {/* Animation Layers */}
                  <div className="settings-card settings-card--wide">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">Animation Layers</h3>
                      <span className="settings-card__current">
                        {
                          Object.values(backgroundAnimationLayers).filter(
                            Boolean
                          ).length
                        }{' '}
                        of 5 enabled
                      </span>
                    </div>
                    <div className="settings-card__options settings-card__options--toggles">
                      <div className="settings-toggle">
                        <button
                          className={`settings-toggle__button ${backgroundAnimationLayers.stars ? 'settings-toggle__button--active' : ''}`}
                          onClick={() =>
                            setBackgroundAnimationLayers({
                              ...backgroundAnimationLayers,
                              stars: !backgroundAnimationLayers.stars
                            })
                          }
                          disabled={isUpdatingBackgroundAnimationLayers}
                          aria-pressed={backgroundAnimationLayers.stars}
                        >
                          <span className="settings-toggle__icon">⭐</span>
                          <span className="settings-toggle__label">Stars</span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.stars ? 'On' : 'Off'}
                          </span>
                        </button>
                      </div>
                      <div className="settings-toggle">
                        <button
                          className={`settings-toggle__button ${backgroundAnimationLayers.particles ? 'settings-toggle__button--active' : ''}`}
                          onClick={() =>
                            setBackgroundAnimationLayers({
                              ...backgroundAnimationLayers,
                              particles: !backgroundAnimationLayers.particles
                            })
                          }
                          disabled={isUpdatingBackgroundAnimationLayers}
                          aria-pressed={backgroundAnimationLayers.particles}
                        >
                          <span className="settings-toggle__icon">✨</span>
                          <span className="settings-toggle__label">
                            Particles
                          </span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.particles ? 'On' : 'Off'}
                          </span>
                        </button>
                      </div>
                      <div className="settings-toggle">
                        <button
                          className={`settings-toggle__button ${backgroundAnimationLayers.nebula ? 'settings-toggle__button--active' : ''}`}
                          onClick={() =>
                            setBackgroundAnimationLayers({
                              ...backgroundAnimationLayers,
                              nebula: !backgroundAnimationLayers.nebula
                            })
                          }
                          disabled={isUpdatingBackgroundAnimationLayers}
                          aria-pressed={backgroundAnimationLayers.nebula}
                        >
                          <span className="settings-toggle__icon">🌫️</span>
                          <span className="settings-toggle__label">Nebula</span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.nebula ? 'On' : 'Off'}
                          </span>
                        </button>
                      </div>
                      <div className="settings-toggle">
                        <button
                          className={`settings-toggle__button ${backgroundAnimationLayers.planets ? 'settings-toggle__button--active' : ''}`}
                          onClick={() =>
                            setBackgroundAnimationLayers({
                              ...backgroundAnimationLayers,
                              planets: !backgroundAnimationLayers.planets
                            })
                          }
                          disabled={isUpdatingBackgroundAnimationLayers}
                          aria-pressed={backgroundAnimationLayers.planets}
                        >
                          <span className="settings-toggle__icon">🪐</span>
                          <span className="settings-toggle__label">
                            Planets
                          </span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.planets ? 'On' : 'Off'}
                          </span>
                        </button>
                      </div>
                      <div className="settings-toggle">
                        <button
                          className={`settings-toggle__button ${backgroundAnimationLayers.aurora ? 'settings-toggle__button--active' : ''}`}
                          onClick={() =>
                            setBackgroundAnimationLayers({
                              ...backgroundAnimationLayers,
                              aurora: !backgroundAnimationLayers.aurora
                            })
                          }
                          disabled={isUpdatingBackgroundAnimationLayers}
                          aria-pressed={backgroundAnimationLayers.aurora}
                        >
                          <span className="settings-toggle__icon">🌈</span>
                          <span className="settings-toggle__label">Aurora</span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.aurora ? 'On' : 'Off'}
                          </span>
                        </button>
                      </div>
                    </div>
                    {backgroundAnimationLayersError && (
                      <div className="settings-card__error">
                        {backgroundAnimationLayersError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Profile Category - Only show for authenticated users */}
          {session?.user && (
            <div className="settings-category">
              <button
                className="settings-category__header"
                onClick={() => toggleCategory('privacy')}
                aria-expanded={
                  categories.find((c) => c.id === 'privacy')?.expanded
                }
              >
                <div className="settings-category__header-content">
                  <span className="settings-category__icon">🔒</span>
                  <div className="settings-category__header-text">
                    <h2 className="settings-category__title">
                      Privacy & Profile
                    </h2>
                    <p className="settings-category__description">
                      Control your profile visibility and data
                    </p>
                  </div>
                </div>
                <span className="settings-category__toggle">
                  {categories.find((c) => c.id === 'privacy')?.expanded
                    ? '−'
                    : '+'}
                </span>
              </button>

              {categories.find((c) => c.id === 'privacy')?.expanded && (
                <div className="settings-category__content">
                  <div className="settings-grid">
                    {/* Profile Visibility */}
                    <div className="settings-card">
                      <div className="settings-card__header">
                        <h3 className="settings-card__title">
                          Profile Visibility
                        </h3>
                        <span className="settings-card__current">
                          {profileVisibility === 'public'
                            ? 'Public'
                            : 'Private'}
                        </span>
                      </div>
                      <div className="settings-card__options">
                        <button
                          className={`settings-option ${profileVisibility === 'public' ? 'settings-option--active' : ''}`}
                          onClick={() => setProfileVisibility('public')}
                          disabled={isUpdatingProfileVisibility}
                          aria-pressed={profileVisibility === 'public'}
                        >
                          <span className="settings-option__icon">🌐</span>
                          <div className="settings-option__content">
                            <span className="settings-option__label">
                              Public
                            </span>
                            <span className="settings-option__desc">
                              Profile visible to everyone
                            </span>
                          </div>
                        </button>
                        <button
                          className={`settings-option ${profileVisibility === 'private' ? 'settings-option--active' : ''}`}
                          onClick={() => setProfileVisibility('private')}
                          disabled={isUpdatingProfileVisibility}
                          aria-pressed={profileVisibility === 'private'}
                        >
                          <span className="settings-option__icon">🔒</span>
                          <div className="settings-option__content">
                            <span className="settings-option__label">
                              Private
                            </span>
                            <span className="settings-option__desc">
                              Profile hidden from others
                            </span>
                          </div>
                        </button>
                      </div>
                      {profileVisibilityError && (
                        <div className="settings-card__error">
                          {profileVisibilityError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Status */}
          <div className="settings-account-status">
            {session?.user ? (
              <div className="settings-account-status__content">
                <div className="settings-account-status__info">
                  <span className="settings-account-status__icon">✅</span>
                  <div className="settings-account-status__details">
                    <div className="settings-account-status__status">
                      Signed in as{' '}
                      <strong>{session.user.name || session.user.email}</strong>
                    </div>
                    <div className="settings-account-status__note">
                      Settings sync across devices
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="settings-account-status__content">
                <div className="settings-account-status__info">
                  <span className="settings-account-status__icon">⚠️</span>
                  <div className="settings-account-status__details">
                    <div className="settings-account-status__status">
                      <strong>Not signed in</strong>
                    </div>
                    <div className="settings-account-status__note">
                      Settings saved locally only
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
