'use client';

import { useState } from 'react';
import { InstantLink } from '../../components/ui/InstantLink';
import styles from '../page.module.css';

interface GenerationFormProps {
  currentSeed: string;
  setCurrentSeed: (seed: string) => void;
  avatarSeed: string;
  setAvatarSeed: (seed: string) => void;
  customQuote: string;
  setCustomQuote: (quote: string) => void;
  customAuthor: string;
  setCustomAuthor: (author: string) => void;
  customWidth: string;
  setCustomWidth: (width: string) => void;
  customHeight: string;
  setCustomHeight: (height: string) => void;
  shapeCount: string;
  setShapeCount: (count: string) => void;
  isQuotaExceeded: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onRandomize: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // Advanced configuration (Pro features)
  generationOptions?: {
    avatarX?: number;
    avatarY?: number;
    avatarSize?: number;
    textMaxWidth?: number;
    textStartY?: number;
    fontSize?: number;
    borderOpacity?: number;
    textPadding?: number;
    lineHeight?: number;
    borderColor?: string;
    patternSeed?: string;
    glassBackground?: boolean;
  };
}

export function GenerationForm({
  currentSeed,
  setCurrentSeed,
  avatarSeed,
  setAvatarSeed,
  customQuote,
  setCustomQuote,
  customAuthor,
  setCustomAuthor,
  customWidth,
  setCustomWidth,
  customHeight,
  setCustomHeight,
  shapeCount,
  setShapeCount,
  isQuotaExceeded,
  isGenerating,
  onGenerate,
  onRandomize,
  isCollapsed,
  onToggleCollapse,
  generationOptions
}: GenerationFormProps) {
  const [isEditingSeed, setIsEditingSeed] = useState<boolean>(false);
  const [tempSeed, setTempSeed] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const handleSeedClick = () => {
    setTempSeed(currentSeed);
    setIsEditingSeed(true);
  };

  const handleSeedSave = () => {
    setCurrentSeed(tempSeed);
    setIsEditingSeed(false);
  };

  const handleSeedCancel = () => {
    setTempSeed(currentSeed);
    setIsEditingSeed(false);
  };

  const handleSeedKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSeedSave();
    } else if (e.key === 'Escape') {
      handleSeedCancel();
    }
  };

  const generateRandomSeed = () => {
    const randomSeed = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSeed(randomSeed);
  };

  return (
    <div className={styles.configuration__form}>
      <div className={styles.form__header}>
        <h3 className={styles.form__title}>🎨 Generation Configuration</h3>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={styles.form__collapse__button}
            title={isCollapsed ? 'Expand form' : 'Collapse form'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* FREE PARAMETERS - Always editable */}
          <div className={styles.form__section}>
            <h4 className={styles.form__subsection__title}>
              🆓 Free Configuration
            </h4>

            {/* Seed Controls Row */}
            <div className={styles.form__row}>
              <label className={styles.form__label}>
                <span className={styles.label__text}>🎲 Main Seed</span>
                <div className={styles.seed__controls}>
                  {isEditingSeed ? (
                    <div className={styles.seed__edit__container}>
                      <input
                        type="text"
                        value={tempSeed}
                        onChange={(e) => setTempSeed(e.target.value)}
                        onKeyDown={handleSeedKeyPress}
                        onBlur={handleSeedCancel}
                        className={styles.seed__input}
                        placeholder="Enter custom seed"
                        autoFocus
                      />
                      <button
                        onClick={handleSeedSave}
                        className={styles.seed__save}
                        title="Save seed"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleSeedCancel}
                        className={styles.seed__cancel}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className={styles.seed__display__container}>
                      <input
                        type="text"
                        value={currentSeed || ''}
                        onClick={handleSeedClick}
                        readOnly
                        className={styles.seed__display__input}
                        placeholder="Random seed"
                      />
                      <button
                        onClick={handleSeedClick}
                        className={styles.seed__edit__btn}
                        title="Edit seed"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={generateRandomSeed}
                        className={styles.seed__random__btn}
                        title="Generate random seed"
                      >
                        🎲
                      </button>
                    </div>
                  )}
                </div>
              </label>

              <label className={styles.form__label}>
                <span className={styles.label__text}>👤 Avatar Seed</span>
                <input
                  type="text"
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  className={styles.form__input}
                  placeholder="Custom avatar seed (leave empty to use main seed)"
                />
              </label>
            </div>

            {/* Quote Configuration */}
            <label className={styles.form__label}>
              <span className={styles.label__text}>💭 Custom Quote</span>
              <textarea
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                className={styles.form__textarea}
                placeholder="Enter custom quote text (leave empty for random quote)"
                rows={2}
              />
            </label>

            <label className={styles.form__label}>
              <span className={styles.label__text}>✍️ Quote Author</span>
              <input
                type="text"
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                className={styles.form__input}
                placeholder="Quote author (leave empty for random)"
              />
            </label>

            {/* Dimensions Row */}
            <div className={styles.form__row}>
              <label className={styles.form__label}>
                <span className={styles.label__text}>📏 Custom Width</span>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className={styles.form__input}
                  placeholder="400-2400px"
                  min="400"
                  max="2400"
                />
              </label>

              <label className={styles.form__label}>
                <span className={styles.label__text}>📐 Custom Height</span>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className={styles.form__input}
                  placeholder="300-1800px"
                  min="300"
                  max="1800"
                />
              </label>

              <label className={styles.form__label}>
                <span className={styles.label__text}>🔲 Shape Count</span>
                <input
                  type="number"
                  value={shapeCount}
                  onChange={(e) =>
                    !isQuotaExceeded && setShapeCount(e.target.value)
                  }
                  className={`${styles.form__input} ${isQuotaExceeded ? styles.form__input__disabled : ''}`}
                  placeholder="3-15 shapes"
                  min="3"
                  max="15"
                  disabled={isQuotaExceeded}
                />
              </label>
            </div>
          </div>

          {/* PRO PARAMETERS - Show expanded details */}
          <div className={styles.form__section}>
            <div className={styles.form__pro__header}>
              <h4 className={styles.form__subsection__title}>
                ⚡ Pro Configuration Options
              </h4>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={styles.form__toggle__button}
                title={
                  showAdvanced
                    ? 'Hide advanced options'
                    : 'Show advanced options'
                }
              >
                {showAdvanced ? '▲ Hide Details' : '▼ Show Details'}
              </button>
            </div>

            {showAdvanced && (
              <div className={styles.form__advanced__content}>
                {/* Avatar Positioning */}
                <h5 className={styles.form__subsection__title}>
                  👤 Avatar Positioning
                </h5>
                <div className={styles.form__row}>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>X Position</span>
                    <input
                      type="number"
                      value={generationOptions?.avatarX || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Auto"
                      readOnly
                    />
                  </label>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Y Position</span>
                    <input
                      type="number"
                      value={generationOptions?.avatarY || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Auto"
                      readOnly
                    />
                  </label>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Size</span>
                    <input
                      type="number"
                      value={generationOptions?.avatarSize || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Auto"
                      readOnly
                    />
                  </label>
                </div>

                {/* Text Positioning */}
                <h5 className={styles.form__subsection__title}>
                  📝 Text Positioning
                </h5>
                <div className={styles.form__row}>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Max Width</span>
                    <input
                      type="number"
                      value={generationOptions?.textMaxWidth || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Auto"
                      readOnly
                    />
                  </label>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Start Y</span>
                    <input
                      type="number"
                      value={generationOptions?.textStartY || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Auto"
                      readOnly
                    />
                  </label>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Font Size</span>
                    <input
                      type="number"
                      value={generationOptions?.fontSize || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Auto"
                      readOnly
                    />
                  </label>
                </div>

                {/* Visual Styling */}
                <h5 className={styles.form__subsection__title}>
                  🎨 Visual Styling
                </h5>
                <div className={styles.form__row}>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Border Opacity</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={generationOptions?.borderOpacity || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="0.7"
                      readOnly
                    />
                  </label>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Text Padding</span>
                    <input
                      type="number"
                      value={generationOptions?.textPadding || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="30"
                      readOnly
                    />
                  </label>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Line Height</span>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="3"
                      value={generationOptions?.lineHeight || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="1.4"
                      readOnly
                    />
                  </label>
                </div>

                {/* Generated Values */}
                <h5 className={styles.form__subsection__title}>
                  🔮 Generated Values
                </h5>
                <div className={styles.form__row}>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Border Color</span>
                    <input
                      type="text"
                      value={generationOptions?.borderColor || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Auto-generated"
                      readOnly
                    />
                  </label>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Pattern Seed</span>
                    <input
                      type="text"
                      value={generationOptions?.patternSeed || ''}
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Auto-generated"
                      readOnly
                    />
                  </label>
                  <label className={styles.form__label}>
                    <span className={styles.label__text}>Glass Background</span>
                    <input
                      type="text"
                      value={
                        generationOptions?.glassBackground
                          ? 'Enabled'
                          : 'Disabled'
                      }
                      className={`${styles.form__input} ${styles.form__input__disabled}`}
                      placeholder="Disabled"
                      readOnly
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Generate Button - Always visible */}
      <div className={styles.form__section}>
        {isQuotaExceeded ? (
          <div className={styles.form__upgrade__notice}>
            <h4>⚡ Daily Quota Exceeded</h4>
            <p>
              You&apos;ve reached your daily generation limit. Upgrade to Pro
              for unlimited generations!
            </p>
            <InstantLink
              href="/subscription"
              className={styles.form__upgrade__button}
            >
              Upgrade to Pro ⚡
            </InstantLink>
          </div>
        ) : (
          <div className={styles.form__buttons}>
            <button
              onClick={onRandomize}
              disabled={isGenerating}
              className={`${styles.randomize__button} ${isGenerating ? styles.randomize__button__disabled : ''}`}
              title="Randomize all settings and generate random quote"
            >
              🎲 Randomize All
            </button>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className={`${styles.generate__button} ${isGenerating ? styles.generate__button__disabled : ''}`}
            >
              {isGenerating ? '🔮 Generating...' : '✨ Generate Image'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
