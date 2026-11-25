'use client';

import {
  useFlairPreference,
  useProfileVisibility,
  useUserPreferences
} from '@lib/context/UserPreferencesContext';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { SubscriptionFlairToggle } from '../components/subscription-badges/SubscriptionFlairToggle';
import type { SettingsEnCopy } from '$i18n-source/settings.en';
import {
  SettingsCopyProvider,
  useSettingsCopy
} from './SettingsCopyContext';
import './settings.css';

type SettingsCategoryId = keyof SettingsEnCopy['categories'];

interface SettingsCategory {
  id: SettingsCategoryId;
  iconId: SiteIconId;
  expanded: boolean;
}

function SettingsIcon({
  id,
  className,
  sizeRem = 1.125,
}: {
  id: SiteIconId;
  className: string;
  sizeRem?: number;
}) {
  return <SiteIcon id={id} className={className} sizeRem={sizeRem} />;
}

function SettingsPageContent() {
  const copy = useSettingsCopy();
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
    ambientAudioReactivityPercent,
    setAmbientAudioReactivityPercent,
    isUpdatingSpacingTheme,
    isUpdatingPaginationMode,
    isUpdatingEmojiPanelBehavior,
    isUpdatingFontPreference,
    isUpdatingAccessibilityFocusMode,
    isUpdatingBackgroundMovementDirection,
    isUpdatingBackgroundMovementSpeed,
    isUpdatingBackgroundAnimationLayers,
    isUpdatingAmbientAudioReactivity,
    spacingThemeError,
    paginationModeError,
    emojiPanelBehaviorError,
    fontPreferenceError,
    accessibilityFocusModeError,
    backgroundMovementDirectionError,
    backgroundMovementSpeedError,
    backgroundAnimationLayersError,
    ambientAudioReactivityError
  } = useUserPreferences();

  const {
    visibility: profileVisibility,
    setVisibility: setProfileVisibility,
    isUpdating: isUpdatingProfileVisibility,
    error: profileVisibilityError
  } = useProfileVisibility();

  const {
    preference: flairPreference,
    setPreference: setFlairPreference,
    isUpdating: isUpdatingFlairPreference,
    error: flairPreferenceError
  } = useFlairPreference();

  // Category expansion state
  const [categories, setCategories] = useState<SettingsCategory[]>([
    { id: 'appearance', iconId: 'palette', expanded: true },
    { id: 'behavior', iconId: 'settings', expanded: true },
    { id: 'accessibility', iconId: 'accessibility', expanded: true },
    { id: 'background', iconId: 'orbit', expanded: true },
    { id: 'privacy', iconId: 'lock', expanded: session?.user ? true : false }
  ]);

  const toggleCategory = (categoryId: SettingsCategoryId) => {
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
          <span>{copy.page.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page__container">
        <div className="settings-page__header">
          <h1 className="settings-page__title">{copy.page.title}</h1>
          <p className="settings-page__description">{copy.page.description}</p>
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
                <SettingsIcon id="palette" className="settings-category__icon" />
                <div className="settings-category__header-text">
                  <h2 className="settings-category__title">
                    {copy.categories.appearance.title}
                  </h2>
                  <p className="settings-category__description">
                    {copy.categories.appearance.description}
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
                      <h3 className="settings-card__title">
                        {copy.appearance.fontFamily.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {fontPreference === 'monospace'
                          ? copy.appearance.fontFamily.code.label
                          : copy.appearance.fontFamily.reading.label}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${fontPreference === 'monospace' ? 'settings-option--active' : ''}`}
                        onClick={() => setFontPreference('monospace')}
                        disabled={isUpdatingFontPreference}
                        aria-pressed={fontPreference === 'monospace'}
                      >
                        <SettingsIcon id="type" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.appearance.fontFamily.code.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.appearance.fontFamily.code.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${fontPreference === 'default' ? 'settings-option--active' : ''}`}
                        onClick={() => setFontPreference('default')}
                        disabled={isUpdatingFontPreference}
                        aria-pressed={fontPreference === 'default'}
                      >
                        <SettingsIcon id="bookOpen" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.appearance.fontFamily.reading.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.appearance.fontFamily.reading.description}
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
                      <h3 className="settings-card__title">
                        {copy.appearance.displayDensity.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {spacingTheme === 'cozy'
                          ? copy.appearance.displayDensity.cozy.label
                          : copy.appearance.displayDensity.compact.label}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${spacingTheme === 'cozy' ? 'settings-option--active' : ''}`}
                        onClick={() => setSpacingTheme('cozy')}
                        disabled={isUpdatingSpacingTheme}
                        aria-pressed={spacingTheme === 'cozy'}
                      >
                        <SettingsIcon id="bookOpen" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.appearance.displayDensity.cozy.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.appearance.displayDensity.cozy.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${spacingTheme === 'compact' ? 'settings-option--active' : ''}`}
                        onClick={() => setSpacingTheme('compact')}
                        disabled={isUpdatingSpacingTheme}
                        aria-pressed={spacingTheme === 'compact'}
                      >
                        <SettingsIcon id="barChart" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.appearance.displayDensity.compact.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.appearance.displayDensity.compact.description}
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
                <SettingsIcon id="settings" className="settings-category__icon" />
                <div className="settings-category__header-text">
                  <h2 className="settings-category__title">
                    {copy.categories.behavior.title}
                  </h2>
                  <p className="settings-category__description">
                    {copy.categories.behavior.description}
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
                      <h3 className="settings-card__title">
                        {copy.behavior.pageNavigation.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {paginationMode === 'traditional'
                          ? copy.behavior.pageNavigation.traditional.label
                          : copy.behavior.pageNavigation.infiniteScroll.label}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${paginationMode === 'traditional' ? 'settings-option--active' : ''}`}
                        onClick={() => setPaginationMode('traditional')}
                        disabled={isUpdatingPaginationMode}
                        aria-pressed={paginationMode === 'traditional'}
                      >
                        <SettingsIcon id="fileText" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.behavior.pageNavigation.traditional.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.behavior.pageNavigation.traditional.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${paginationMode === 'infinite' ? 'settings-option--active' : ''}`}
                        onClick={() => setPaginationMode('infinite')}
                        disabled={isUpdatingPaginationMode}
                        aria-pressed={paginationMode === 'infinite'}
                      >
                        <SettingsIcon id="infinity" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.behavior.pageNavigation.infiniteScroll.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.behavior.pageNavigation.infiniteScroll.description}
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
                      <h3 className="settings-card__title">
                        {copy.behavior.emojiPanel.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {emojiPanelBehavior === 'close_after_select'
                          ? copy.behavior.emojiPanel.closeAfterSelect.label
                          : copy.behavior.emojiPanel.stayOpen.label}
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
                        <SettingsIcon id="target" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.behavior.emojiPanel.closeAfterSelect.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.behavior.emojiPanel.closeAfterSelect.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${emojiPanelBehavior === 'stay_open' ? 'settings-option--active' : ''}`}
                        onClick={() => setEmojiPanelBehavior('stay_open')}
                        disabled={isUpdatingEmojiPanelBehavior}
                        aria-pressed={emojiPanelBehavior === 'stay_open'}
                      >
                        <SettingsIcon id="pin" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.behavior.emojiPanel.stayOpen.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.behavior.emojiPanel.stayOpen.description}
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
                <SettingsIcon id="accessibility" className="settings-category__icon" />
                <div className="settings-category__header-text">
                  <h2 className="settings-category__title">
                    {copy.categories.accessibility.title}
                  </h2>
                  <p className="settings-category__description">
                    {copy.categories.accessibility.description}
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
                      <h3 className="settings-card__title">
                        {copy.accessibility.focusIndicators.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {accessibilityFocusMode === 'enabled'
                          ? copy.common.enabled
                          : copy.common.disabled}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${accessibilityFocusMode === 'disabled' ? 'settings-option--active' : ''}`}
                        onClick={() => setAccessibilityFocusMode('disabled')}
                        disabled={isUpdatingAccessibilityFocusMode}
                        aria-pressed={accessibilityFocusMode === 'disabled'}
                      >
                        <SettingsIcon id="target" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.accessibility.focusIndicators.disabled.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.accessibility.focusIndicators.disabled.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${accessibilityFocusMode === 'enabled' ? 'settings-option--active' : ''}`}
                        onClick={() => setAccessibilityFocusMode('enabled')}
                        disabled={isUpdatingAccessibilityFocusMode}
                        aria-pressed={accessibilityFocusMode === 'enabled'}
                      >
                        <SettingsIcon id="search" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.accessibility.focusIndicators.enabled.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.accessibility.focusIndicators.enabled.description}
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
                <SettingsIcon id="orbit" className="settings-category__icon" />
                <div className="settings-category__header-text">
                  <h2 className="settings-category__title">
                    {copy.categories.background.title}
                  </h2>
                  <p className="settings-category__description">
                    {copy.categories.background.description}
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
                        {copy.background.movementDirection.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {backgroundMovementDirection === 'static'
                          ? copy.background.movementDirection.static.label
                          : backgroundMovementDirection === 'forward'
                            ? copy.background.movementDirection.forward.label
                            : backgroundMovementDirection === 'backward'
                              ? copy.background.movementDirection.backward.label
                              : backgroundMovementDirection === 'left'
                                ? copy.background.movementDirection.left.label
                                : backgroundMovementDirection === 'right'
                                  ? copy.background.movementDirection.right.label
                                  : backgroundMovementDirection === 'up'
                                    ? copy.background.movementDirection.up.label
                                    : copy.background.movementDirection.down.label}
                      </span>
                    </div>
                    <div className="settings-card__options settings-card__options--grid">
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'static' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('static')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'static'}
                      >
                        <SettingsIcon id="pause" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementDirection.static.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementDirection.static.description}
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
                        <SettingsIcon id="arrowUp" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementDirection.forward.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementDirection.forward.description}
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
                        <SettingsIcon id="arrowDown" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementDirection.backward.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementDirection.backward.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'left' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('left')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'left'}
                      >
                        <SettingsIcon id="arrowLeft" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementDirection.left.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementDirection.left.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'right' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('right')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'right'}
                      >
                        <SettingsIcon id="arrowRight" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementDirection.right.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementDirection.right.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'up' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('up')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'up'}
                      >
                        <SettingsIcon id="arrowUp" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementDirection.up.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementDirection.up.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementDirection === 'down' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementDirection('down')}
                        disabled={isUpdatingBackgroundMovementDirection}
                        aria-pressed={backgroundMovementDirection === 'down'}
                      >
                        <SettingsIcon id="arrowDown" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementDirection.down.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementDirection.down.description}
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
                      <h3 className="settings-card__title">
                        {copy.background.movementSpeed.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {backgroundMovementSpeed === 'slow'
                          ? copy.background.movementSpeed.slow.label
                          : backgroundMovementSpeed === 'normal'
                            ? copy.background.movementSpeed.normal.label
                            : copy.background.movementSpeed.fast.label}
                      </span>
                    </div>
                    <div className="settings-card__options">
                      <button
                        className={`settings-option ${backgroundMovementSpeed === 'slow' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementSpeed('slow')}
                        disabled={isUpdatingBackgroundMovementSpeed}
                        aria-pressed={backgroundMovementSpeed === 'slow'}
                      >
                        <SettingsIcon id="turtle" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementSpeed.slow.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementSpeed.slow.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementSpeed === 'normal' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementSpeed('normal')}
                        disabled={isUpdatingBackgroundMovementSpeed}
                        aria-pressed={backgroundMovementSpeed === 'normal'}
                      >
                        <SettingsIcon id="rocket" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementSpeed.normal.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementSpeed.normal.description}
                          </span>
                        </div>
                      </button>
                      <button
                        className={`settings-option ${backgroundMovementSpeed === 'fast' ? 'settings-option--active' : ''}`}
                        onClick={() => setBackgroundMovementSpeed('fast')}
                        disabled={isUpdatingBackgroundMovementSpeed}
                        aria-pressed={backgroundMovementSpeed === 'fast'}
                      >
                        <SettingsIcon id="zap" className="settings-option__icon" />
                        <div className="settings-option__content">
                          <span className="settings-option__label">
                            {copy.background.movementSpeed.fast.label}
                          </span>
                          <span className="settings-option__desc">
                            {copy.background.movementSpeed.fast.description}
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

                  {/* Background audio reactivity */}
                  <div className="settings-card settings-card--wide">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">
                        {copy.background.audioReactivity.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {ambientAudioReactivityPercent}%
                      </span>
                    </div>
                    <p className="settings-card__hint">
                      {copy.background.audioReactivity.hint}
                    </p>
                    <div className="settings-range">
                      <label className="settings-range__label" htmlFor="ambient-audio-reactivity">
                        {copy.background.audioReactivity.rangeLabel}
                      </label>
                      <input
                        id="ambient-audio-reactivity"
                        className="settings-range__input"
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={ambientAudioReactivityPercent}
                        onChange={(event) => {
                          void setAmbientAudioReactivityPercent(
                            Number(event.target.value)
                          );
                        }}
                        disabled={isUpdatingAmbientAudioReactivity}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={ambientAudioReactivityPercent}
                        aria-valuetext={`${ambientAudioReactivityPercent}%`}
                      />
                      <div className="settings-range__ticks" aria-hidden="true">
                        <span>{copy.background.audioReactivity.tickOff}</span>
                        <span>{copy.background.audioReactivity.tickFull}</span>
                      </div>
                    </div>
                    {ambientAudioReactivityError && (
                      <div className="settings-card__error">
                        {ambientAudioReactivityError}
                      </div>
                    )}
                  </div>

                  {/* Animation Layers */}
                  <div className="settings-card settings-card--wide">
                    <div className="settings-card__header">
                      <h3 className="settings-card__title">
                        {copy.background.animationLayers.cardTitle}
                      </h3>
                      <span className="settings-card__current">
                        {
                          Object.values(backgroundAnimationLayers).filter(
                            Boolean
                          ).length
                        }{' '}
                        {copy.background.animationLayers.enabledCountSuffix}
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
                          <SettingsIcon id="star" className="settings-toggle__icon" />
                          <span className="settings-toggle__label">
                            {copy.background.animationLayers.stars}
                          </span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.stars
                              ? copy.common.on
                              : copy.common.off}
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
                          <SettingsIcon id="sparkles" className="settings-toggle__icon" />
                          <span className="settings-toggle__label">
                            {copy.background.animationLayers.particles}
                          </span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.particles
                              ? copy.common.on
                              : copy.common.off}
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
                          <SettingsIcon id="cloudFog" className="settings-toggle__icon" />
                          <span className="settings-toggle__label">
                            {copy.background.animationLayers.nebula}
                          </span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.nebula
                              ? copy.common.on
                              : copy.common.off}
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
                          <SettingsIcon id="orbit" className="settings-toggle__icon" />
                          <span className="settings-toggle__label">
                            {copy.background.animationLayers.planets}
                          </span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.planets
                              ? copy.common.on
                              : copy.common.off}
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
                          <SettingsIcon id="rainbow" className="settings-toggle__icon" />
                          <span className="settings-toggle__label">
                            {copy.background.animationLayers.aurora}
                          </span>
                          <span className="settings-toggle__status">
                            {backgroundAnimationLayers.aurora
                              ? copy.common.on
                              : copy.common.off}
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
                  <SettingsIcon id="lock" className="settings-category__icon" />
                  <div className="settings-category__header-text">
                    <h2 className="settings-category__title">
                      {copy.categories.privacy.title}
                    </h2>
                    <p className="settings-category__description">
                      {copy.categories.privacy.description}
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
                          {copy.privacy.profileVisibility.cardTitle}
                        </h3>
                        <span className="settings-card__current">
                          {profileVisibility === 'public'
                            ? copy.privacy.profileVisibility.public.label
                            : copy.privacy.profileVisibility.private.label}
                        </span>
                      </div>
                      <div className="settings-card__options">
                        <button
                          className={`settings-option ${profileVisibility === 'public' ? 'settings-option--active' : ''}`}
                          onClick={() => setProfileVisibility('public')}
                          disabled={isUpdatingProfileVisibility}
                          aria-pressed={profileVisibility === 'public'}
                        >
                          <SettingsIcon id="globe" className="settings-option__icon" />
                          <div className="settings-option__content">
                            <span className="settings-option__label">
                              {copy.privacy.profileVisibility.public.label}
                            </span>
                            <span className="settings-option__desc">
                              {copy.privacy.profileVisibility.public.description}
                            </span>
                          </div>
                        </button>
                        <button
                          className={`settings-option ${profileVisibility === 'private' ? 'settings-option--active' : ''}`}
                          onClick={() => setProfileVisibility('private')}
                          disabled={isUpdatingProfileVisibility}
                          aria-pressed={profileVisibility === 'private'}
                        >
                          <SettingsIcon id="lock" className="settings-option__icon" />
                          <div className="settings-option__content">
                            <span className="settings-option__label">
                              {copy.privacy.profileVisibility.private.label}
                            </span>
                            <span className="settings-option__desc">
                              {copy.privacy.profileVisibility.private.description}
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

                    {/* Username Flair - Use proper subscription-filtered component */}
                    {session?.user?.id && (
                      <SubscriptionFlairToggle
                        userId={session.user.id}
                        className="settings-card settings-card--wide"
                      />
                    )}
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
                  <SettingsIcon id="check" className="settings-account-status__icon" />
                  <div className="settings-account-status__details">
                    <div className="settings-account-status__status">
                      {copy.account.signedInAsPrefix}{' '}
                      <strong>{session.user.name || session.user.email}</strong>
                    </div>
                    <div className="settings-account-status__note">
                      {copy.account.syncNote}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="settings-account-status__content">
                <div className="settings-account-status__info">
                  <SettingsIcon id="alertTriangle" className="settings-account-status__icon" />
                  <div className="settings-account-status__details">
                    <div className="settings-account-status__status">
                      <strong>{copy.account.notSignedIn}</strong>
                    </div>
                    <div className="settings-account-status__note">
                      {copy.account.localOnlyNote}
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

export default function SettingsPage() {
  return (
    <SettingsCopyProvider>
      <SettingsPageContent />
    </SettingsCopyProvider>
  );
}
