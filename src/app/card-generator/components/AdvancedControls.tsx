'use client';

import { GenerationOptions } from '../types/generation';
import styles from './AdvancedControls.module.css';
import formStyles from './FormElements.module.css';

interface AdvancedControlsProps {
  options: Partial<GenerationOptions>;
  onOptionsChange: (options: Partial<GenerationOptions>) => void;
  isProUser: boolean;
  isReadonly?: boolean;
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

export function AdvancedControls({
  options,
  onOptionsChange,
  isProUser,
  isReadonly = false,
  generationOptions
}: AdvancedControlsProps) {
  const disabled = !isProUser;

  const handleChange = (key: keyof GenerationOptions, value: any) => {
    if (disabled) return;
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  // Helper function to get numeric display values - prioritize user input
  const getNumericDisplayValue = (
    key: keyof Partial<GenerationOptions>
  ): number | undefined => {
    // Prioritize user input values over generated values
    const userValue = options[key];
    if (typeof userValue === 'number') {
      return userValue;
    }
    // Fall back to generated values for auto-fill when no user input
    if (generationOptions && key in generationOptions) {
      const value = generationOptions[key as keyof typeof generationOptions];
      return typeof value === 'number' ? value : undefined;
    }
    return undefined;
  };

  // Helper function to get string display values - prioritize user input
  const getStringDisplayValue = (
    key: keyof Partial<GenerationOptions>
  ): string | undefined => {
    // Prioritize user input values over generated values
    const userValue = options[key];
    if (typeof userValue === 'string') {
      return userValue;
    }
    // Fall back to generated values for auto-fill when no user input
    if (generationOptions && key in generationOptions) {
      const value = generationOptions[key as keyof typeof generationOptions];
      return typeof value === 'string' ? value : undefined;
    }
    return undefined;
  };

  // Helper function to get boolean display values - prioritize user input
  const getBooleanDisplayValue = (
    key: keyof Partial<GenerationOptions>
  ): boolean => {
    // Prioritize user input values over generated values
    const userValue = options[key];
    if (typeof userValue === 'boolean') {
      return userValue;
    }
    // Fall back to generated values for auto-fill when no user input
    if (generationOptions && key in generationOptions) {
      const value = generationOptions[key as keyof typeof generationOptions];
      return typeof value === 'boolean' ? value : false;
    }
    return false;
  };

  return (
    <div className={styles.advanced__options}>
      {!isProUser && (
        <div className={styles.advanced__paywall__notice}>
          <h4>🚀 Unlock Advanced Magic</h4>
          <p>
            Get precise control over avatar positioning, text layout, visual
            styling, and more with Pro subscription.
          </p>
          <a href="/subscription" className={styles.advanced__upgrade__link}>
            Upgrade to Pro ⚡
          </a>
        </div>
      )}

      <div className={styles.advanced__controls__grid}>
        {/* Positioning Controls */}
        <div className={formStyles.form__section}>
          <h5 className={formStyles.form__subsection__title}>
            📍 Avatar Positioning
          </h5>
          <div className={formStyles.form__row}>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Avatar X</span>
              <input
                type="number"
                value={getNumericDisplayValue('avatarX') || ''}
                onChange={(e) =>
                  handleChange('avatarX', parseInt(e.target.value) || undefined)
                }
                disabled={disabled}
                placeholder="Auto"
                min="0"
                max="2000"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Avatar Y</span>
              <input
                type="number"
                value={getNumericDisplayValue('avatarY') || ''}
                onChange={(e) =>
                  handleChange('avatarY', parseInt(e.target.value) || undefined)
                }
                disabled={disabled}
                placeholder="Auto"
                min="0"
                max="2000"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Avatar Size</span>
              <input
                type="number"
                value={getNumericDisplayValue('avatarSize') || ''}
                onChange={(e) =>
                  handleChange(
                    'avatarSize',
                    parseInt(e.target.value) || undefined
                  )
                }
                disabled={disabled}
                placeholder="Auto"
                min="50"
                max="500"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
          </div>
        </div>

        {/* Text Controls */}
        <div className={formStyles.form__section}>
          <h5 className={formStyles.form__subsection__title}>📝 Text Layout</h5>
          <div className={formStyles.form__row}>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Text Max Width</span>
              <input
                type="number"
                value={getNumericDisplayValue('textMaxWidth') || ''}
                onChange={(e) =>
                  handleChange(
                    'textMaxWidth',
                    parseInt(e.target.value) || undefined
                  )
                }
                disabled={disabled}
                placeholder="Auto"
                min="200"
                max="1000"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Text Start Y</span>
              <input
                type="number"
                value={getNumericDisplayValue('textStartY') || ''}
                onChange={(e) =>
                  handleChange(
                    'textStartY',
                    parseInt(e.target.value) || undefined
                  )
                }
                disabled={disabled}
                placeholder="Auto"
                min="50"
                max="800"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Text Padding</span>
              <input
                type="number"
                value={getNumericDisplayValue('textPadding') || ''}
                onChange={(e) =>
                  handleChange(
                    'textPadding',
                    parseInt(e.target.value) || undefined
                  )
                }
                disabled={disabled}
                placeholder="30"
                min="10"
                max="100"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
          </div>
        </div>

        {/* Visual Controls */}
        <div className={formStyles.form__section}>
          <h5 className={formStyles.form__subsection__title}>
            🎨 Visual Effects
          </h5>
          <div className={formStyles.form__row}>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Font Size</span>
              <input
                type="number"
                value={getNumericDisplayValue('fontSize') || ''}
                onChange={(e) =>
                  handleChange(
                    'fontSize',
                    parseInt(e.target.value) || undefined
                  )
                }
                disabled={disabled}
                placeholder="Auto"
                min="12"
                max="72"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Line Height</span>
              <input
                type="number"
                step="0.1"
                value={getNumericDisplayValue('lineHeight') || ''}
                onChange={(e) =>
                  handleChange(
                    'lineHeight',
                    parseFloat(e.target.value) || undefined
                  )
                }
                disabled={disabled}
                placeholder="1.4"
                min="1.0"
                max="3.0"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Border Opacity</span>
              <input
                type="number"
                step="0.1"
                value={getNumericDisplayValue('borderOpacity') || ''}
                onChange={(e) =>
                  handleChange(
                    'borderOpacity',
                    parseFloat(e.target.value) || undefined
                  )
                }
                disabled={disabled}
                placeholder="0.7"
                min="0"
                max="1"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
          </div>
        </div>

        {/* Pattern Controls */}
        <div className={formStyles.form__section}>
          <h5 className={formStyles.form__subsection__title}>
            🌟 Pattern Magic
          </h5>
          <div className={formStyles.form__row}>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Border Color</span>
              <input
                type="color"
                value={getStringDisplayValue('borderColor') || '#ffffff'}
                onChange={(e) => handleChange('borderColor', e.target.value)}
                disabled={disabled}
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
                style={{ height: '56px' }} // Match other input heights
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>Pattern Seed</span>
              <input
                type="text"
                value={getStringDisplayValue('patternSeed') || ''}
                onChange={(e) =>
                  handleChange('patternSeed', e.target.value || undefined)
                }
                disabled={disabled}
                placeholder="Auto-generated"
                className={`${formStyles.form__input} ${disabled ? formStyles.form__input__disabled : ''}`}
              />
            </label>
            <label className={formStyles.form__checkbox__label}>
              <input
                type="checkbox"
                checked={getBooleanDisplayValue('glassBackground')}
                onChange={(e) =>
                  handleChange('glassBackground', e.target.checked)
                }
                disabled={disabled}
                className={formStyles.form__checkbox}
              />
              <span className={formStyles.label__text}>
                Glass Background Effect
              </span>
            </label>
          </div>
        </div>
      </div>

      {disabled && (
        <div className={styles.upgrade__overlay}>
          <div className={styles.upgrade__content}>
            <h4>🔮 Unlock Advanced Magic</h4>
            <p>
              Gain precise control over every aspect of your mystical cards!
            </p>
            <button
              className={styles.upgrade__button}
              onClick={() => (window.location.href = '/subscription')}
            >
              Ascend to Archmage ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
