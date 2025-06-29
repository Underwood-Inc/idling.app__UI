'use client';

import styles from '../page.module.css';
import { GenerationOptions } from '../types/generation';

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
    <div className={styles.advanced__controls}>
      <h3 className={styles.section__title}>
        🔮 Advanced Mystical Controls
        {!isProUser && <span className={styles.pro__badge}>PRO</span>}
      </h3>

      {!isProUser && (
        <div className={styles.pro__notice}>
          <p>✨ Unlock advanced controls with Pro subscription!</p>
        </div>
      )}

      <div className={styles.controls__grid}>
        {/* Positioning Controls */}
        <div className={styles.control__section}>
          <h4>📍 Avatar Positioning</h4>
          <div className={styles.control__row}>
            <label>
              Avatar X:
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
              />
            </label>
            <label>
              Avatar Y:
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
              />
            </label>
            <label>
              Avatar Size:
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
              />
            </label>
          </div>
        </div>

        {/* Text Controls */}
        <div className={styles.control__section}>
          <h4>📝 Text Layout</h4>
          <div className={styles.control__row}>
            <label>
              Text Max Width:
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
              />
            </label>
            <label>
              Text Start Y:
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
              />
            </label>
            <label>
              Text Padding:
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
              />
            </label>
          </div>
        </div>

        {/* Visual Controls */}
        <div className={styles.control__section}>
          <h4>🎨 Visual Effects</h4>
          <div className={styles.control__row}>
            <label>
              Font Size:
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
              />
            </label>
            <label>
              Line Height:
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
              />
            </label>
            <label>
              Border Opacity:
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
              />
            </label>
          </div>
        </div>

        {/* Pattern Controls */}
        <div className={styles.control__section}>
          <h4>🌟 Pattern Magic</h4>
          <div className={styles.control__row}>
            <label>
              Border Color:
              <input
                type="color"
                value={options.borderColor || '#ffffff'}
                onChange={(e) => handleChange('borderColor', e.target.value)}
                disabled={disabled}
              />
            </label>
            <label>
              Pattern Seed:
              <input
                type="text"
                value={options.patternSeed || ''}
                onChange={(e) =>
                  handleChange('patternSeed', e.target.value || undefined)
                }
                disabled={disabled}
                placeholder="Auto-generated"
              />
            </label>
            <label className={styles.checkbox__label}>
              <input
                type="checkbox"
                checked={options.glassBackground || false}
                onChange={(e) =>
                  handleChange('glassBackground', e.target.checked)
                }
                disabled={disabled}
              />
              Glass Background Effect
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
