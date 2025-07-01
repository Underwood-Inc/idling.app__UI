'use client';

import { GenerationOptions } from '../types/generation';
import styles from './AdvancedControls.module.css';

interface AdvancedControlsProps {
  options: Partial<GenerationOptions>;
  onOptionsChange: (options: Partial<GenerationOptions>) => void;
  isProUser: boolean;
  isReadonly?: boolean;
}

export function AdvancedControls({
  options,
  onOptionsChange,
  isProUser,
  isReadonly = false
}: AdvancedControlsProps) {
  const disabled = !isProUser || isReadonly;

  const handleChange = (key: keyof GenerationOptions, value: any) => {
    if (disabled) return;
    onOptionsChange({
      ...options,
      [key]: value
    });
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
        <div className={styles.form__subsection}>
          <h5 className={styles.form__subsection__title}>
            📍 Avatar Positioning
          </h5>
          <div className={styles.form__row}>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Avatar X</span>
              <input
                type="number"
                value={options.avatarX || ''}
                onChange={(e) =>
                  handleChange('avatarX', parseInt(e.target.value) || undefined)
                }
                disabled={disabled}
                placeholder="Auto"
                min="0"
                max="2000"
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Avatar Y</span>
              <input
                type="number"
                value={options.avatarY || ''}
                onChange={(e) =>
                  handleChange('avatarY', parseInt(e.target.value) || undefined)
                }
                disabled={disabled}
                placeholder="Auto"
                min="0"
                max="2000"
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Avatar Size</span>
              <input
                type="number"
                value={options.avatarSize || ''}
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
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
          </div>
        </div>

        {/* Text Controls */}
        <div className={styles.form__subsection}>
          <h5 className={styles.form__subsection__title}>📝 Text Layout</h5>
          <div className={styles.form__row}>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Text Max Width</span>
              <input
                type="number"
                value={options.textMaxWidth || ''}
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
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Text Start Y</span>
              <input
                type="number"
                value={options.textStartY || ''}
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
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Text Padding</span>
              <input
                type="number"
                value={options.textPadding || ''}
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
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
          </div>
        </div>

        {/* Visual Controls */}
        <div className={styles.form__subsection}>
          <h5 className={styles.form__subsection__title}>🎨 Visual Effects</h5>
          <div className={styles.form__row}>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Font Size</span>
              <input
                type="number"
                value={options.fontSize || ''}
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
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Line Height</span>
              <input
                type="number"
                step="0.1"
                value={options.lineHeight || ''}
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
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Border Opacity</span>
              <input
                type="number"
                step="0.1"
                value={options.borderOpacity || ''}
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
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
          </div>
        </div>

        {/* Pattern Controls */}
        <div className={styles.form__subsection}>
          <h5 className={styles.form__subsection__title}>🌟 Pattern Magic</h5>
          <div className={styles.form__row}>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Border Color</span>
              <input
                type="color"
                value={options.borderColor || '#ffffff'}
                onChange={(e) => handleChange('borderColor', e.target.value)}
                disabled={disabled}
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
            <label className={styles.form__label}>
              <span className={styles.label__text}>Pattern Seed</span>
              <input
                type="text"
                value={options.patternSeed || ''}
                onChange={(e) =>
                  handleChange('patternSeed', e.target.value || undefined)
                }
                disabled={disabled}
                placeholder="Auto-generated"
                className={`${styles.form__input} ${disabled ? styles.form__input__disabled : ''}`}
              />
            </label>
            <label className={styles.form__checkbox__label}>
              <input
                type="checkbox"
                checked={options.glassBackground || false}
                onChange={(e) =>
                  handleChange('glassBackground', e.target.checked)
                }
                disabled={disabled}
                className={`${styles.form__checkbox} ${disabled ? styles.form__checkbox : ''}`}
              />
              <span className={styles.label__text}>
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
