'use client';

import React, { useState } from 'react';
import { Card } from '../../components/card/Card';
import { InstantLink } from '../../components/ui/InstantLink';
import type { GenerationOptions } from '../types/generation';
import { AdvancedControls } from './AdvancedControls';
import formStyles from './FormElements.module.css';

export interface AspectRatioOption {
  key: string;
  name: string;
  width: number;
  height: number;
  description: string;
  dimensions: string;
}

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
  // Aspect ratio props
  selectedRatio: AspectRatioOption;
  onRatioChange: (ratio: AspectRatioOption) => void;
  aspectRatioOptions: AspectRatioOption[];
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
  // Advanced options state and handlers
  advancedOptions?: Partial<GenerationOptions>;
  onAdvancedOptionsChange?: (options: Partial<GenerationOptions>) => void;
  isProUser?: boolean;
  // Read-only state for loaded generations
  isReadOnly?: boolean;
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
  selectedRatio,
  onRatioChange,
  aspectRatioOptions,
  generationOptions,
  advancedOptions,
  onAdvancedOptionsChange,
  isProUser,
  isReadOnly = false
}: GenerationFormProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [editingSeed, setEditingSeed] = useState<'main' | 'avatar' | null>(
    null
  );
  const [tempSeed, setTempSeed] = useState('');

  const handleSeedEdit = (type: 'main' | 'avatar') => {
    const currentValue = type === 'main' ? currentSeed : avatarSeed;
    setTempSeed(currentValue);
    setEditingSeed(type);
  };

  const handleSeedSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeed === 'main') {
      setCurrentSeed(tempSeed);
    } else if (editingSeed === 'avatar') {
      setAvatarSeed(tempSeed);
    }
    setEditingSeed(null);
    setTempSeed('');
  };

  const handleSeedCancel = () => {
    setEditingSeed(null);
    setTempSeed('');
  };

  return (
    <Card width="full" className={formStyles.generation__form__container}>
      {/* Form Header */}
      <div className={formStyles.form__header}>
        <div className={formStyles.form__title__container}>
          <h3 className={formStyles.form__title}>Configuration</h3>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={formStyles.form__collapse__button}
              title={isCollapsed ? 'Expand form' : 'Collapse form'}
            >
              <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
              <svg
                className={`${formStyles.form__collapse__chevron} ${
                  isCollapsed
                    ? formStyles['form__collapse__chevron--collapsed']
                    : formStyles['form__collapse__chevron--expanded']
                }`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Form Content */}
      <div
        className={`${formStyles.form__collapsible__content} ${
          isCollapsed
            ? formStyles['form__collapsible__content--collapsed']
            : formStyles['form__collapsible__content--expanded']
        }`}
      >
        {/* Read-only banner for loaded generations */}
        {isReadOnly && (
          <div className={formStyles.form__readonly__banner}>
            <span className={formStyles.readonly__icon}>🔒</span>
            <div className={formStyles.readonly__text}>
              <strong>Viewing Loaded Generation</strong>
              <p>
                This configuration is read-only. Create a new generation to make
                changes.
              </p>
            </div>
          </div>
        )}

        {/* Free Configuration Section */}
        <div className={formStyles.form__section}>
          <h4 className={formStyles.form__section__title}>
            ⚡ Free Configuration
          </h4>

          {/* Seeds Section */}
          <div className={formStyles.seed__controls__container}>
            <div className={formStyles.seed__controls}>
              <div className={formStyles.seed__control__group}>
                <label className={formStyles.form__label}>
                  <span className={formStyles.label__text}>🎲 Main Seed</span>
                  <div className={formStyles.seed__display__container}>
                    {editingSeed === 'main' ? (
                      <div className={formStyles.seed__edit__container}>
                        <input
                          type="text"
                          value={tempSeed}
                          onChange={(e) => setTempSeed(e.target.value)}
                          className={formStyles.seed__input}
                          placeholder="Enter custom seed..."
                        />
                        <button
                          onClick={handleSeedSave}
                          className={formStyles.seed__save}
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleSeedCancel}
                          className={formStyles.seed__cancel}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className={formStyles.seed__display}>
                        <input
                          type="text"
                          value={currentSeed}
                          readOnly
                          className={formStyles.seed__display__input}
                          placeholder="Auto-generated seed"
                        />
                        <button
                          onClick={() => handleSeedEdit('main')}
                          className={formStyles.seed__edit__btn}
                          title="Edit seed"
                          disabled={isReadOnly}
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className={formStyles.seed__control__group}>
                <label className={formStyles.form__label}>
                  <span className={formStyles.label__text}>🧙‍♂️ Avatar Seed</span>
                  <div className={formStyles.seed__display__container}>
                    {editingSeed === 'avatar' ? (
                      <div className={formStyles.seed__edit__container}>
                        <input
                          type="text"
                          value={tempSeed}
                          onChange={(e) => setTempSeed(e.target.value)}
                          className={formStyles.seed__input}
                          placeholder="Leave empty to use main seed"
                        />
                        <button
                          onClick={handleSeedSave}
                          className={formStyles.seed__save}
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleSeedCancel}
                          className={formStyles.seed__cancel}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className={formStyles.seed__display}>
                        <input
                          type="text"
                          value={avatarSeed}
                          readOnly
                          className={formStyles.seed__display__input}
                          placeholder="Custom avatar seed (leave empty for random)"
                        />
                        <button
                          onClick={() => handleSeedEdit('avatar')}
                          className={formStyles.seed__edit__btn}
                          title="Edit avatar seed"
                          disabled={isReadOnly}
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Quote and Author Section - Author first, both full width */}
          <div className={formStyles.form__section}>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>👤 Author</span>
              <input
                type="text"
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                className={`${formStyles.form__input} ${isReadOnly ? formStyles.form__input__disabled : ''}`}
                placeholder="Quote author (leave empty for random)"
                disabled={isReadOnly}
              />
            </label>

            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>💬 Quote</span>
              <textarea
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                className={`${formStyles.form__textarea} ${isReadOnly ? formStyles.form__input__disabled : ''}`}
                placeholder="Enter custom quote (leave empty for random quote)"
                rows={3}
                disabled={isReadOnly}
              />
            </label>
          </div>

          {/* Aspect Ratio Section */}
          <div className={formStyles.form__row}>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>📐 Aspect Ratio</span>
              <select
                value={selectedRatio.key}
                onChange={(e) => {
                  const ratio = aspectRatioOptions.find(
                    (r) => r.key === e.target.value
                  );
                  if (ratio) onRatioChange(ratio);
                }}
                className={`${formStyles.form__input} ${isReadOnly ? formStyles.form__input__disabled : ''}`}
                disabled={isReadOnly}
              >
                {aspectRatioOptions.map((ratio) => (
                  <option key={ratio.key} value={ratio.key}>
                    {ratio.name} ({ratio.dimensions})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Dimensions Section */}
          <div className={`${formStyles.form__row} dimensions__row`}>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>📏 Width</span>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className={`${formStyles.form__input} ${isReadOnly ? formStyles.form__input__disabled : ''}`}
                placeholder="Auto"
                min="400"
                max="2000"
                disabled={isReadOnly}
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>📏 Height</span>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                className={`${formStyles.form__input} ${isReadOnly ? formStyles.form__input__disabled : ''}`}
                placeholder="Auto"
                min="400"
                max="2000"
                disabled={isReadOnly}
              />
            </label>
            <label className={formStyles.form__label}>
              <span className={formStyles.label__text}>🔢 Shape Count</span>
              <input
                type="number"
                value={shapeCount}
                onChange={(e) => setShapeCount(e.target.value)}
                className={`${formStyles.form__input} ${isReadOnly ? formStyles.form__input__disabled : ''}`}
                placeholder="8"
                min="0"
                max="20"
                disabled={isReadOnly}
              />
            </label>
          </div>
        </div>

        {/* Pro Configuration Section */}
        <div className={formStyles.form__pro__section}>
          <div className={formStyles.form__pro__header}>
            <h4 className={formStyles.form__section__title}>
              ⚡ Pro Configuration Options
              <span className={formStyles.pro__badge}>PRO</span>
            </h4>
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={formStyles.form__toggle__button}
            >
              <span>{isAdvancedOpen ? 'Hide Details' : 'Show Details'}</span>
              <svg
                className={`${formStyles.form__toggle__chevron} ${
                  isAdvancedOpen
                    ? formStyles['form__toggle__chevron--expanded']
                    : formStyles['form__toggle__chevron--collapsed']
                }`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
          </div>

          <div
            className={`${formStyles.form__advanced__content} ${
              isAdvancedOpen
                ? formStyles['form__advanced__content--expanded']
                : formStyles['form__advanced__content--collapsed']
            }`}
          >
            <AdvancedControls
              options={advancedOptions || {}}
              onOptionsChange={onAdvancedOptionsChange || (() => {})}
              isProUser={isProUser || false}
              isReadonly={!isProUser || isReadOnly}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className={formStyles.form__buttons}>
          <button
            onClick={onRandomize}
            className={`${formStyles.randomize__button} ${isQuotaExceeded || isReadOnly ? formStyles.randomize__button__disabled : ''}`}
            disabled={isQuotaExceeded || isReadOnly}
            title={
              isReadOnly
                ? 'Cannot modify loaded generation'
                : 'Randomize all fields'
            }
          >
            🎲 Randomize All
          </button>

          <button
            onClick={onGenerate}
            className={`${formStyles.generate__button} ${
              isQuotaExceeded || isGenerating || isReadOnly
                ? formStyles.generate__button__disabled
                : ''
            }`}
            disabled={isQuotaExceeded || isGenerating || isReadOnly}
            title={isReadOnly ? 'Cannot modify loaded generation' : undefined}
          >
            {isReadOnly
              ? '🔒 Read-Only Generation'
              : isGenerating
                ? '🔮 Generating...'
                : '⚡ Generate Image'}
          </button>
        </div>

        {isQuotaExceeded && (
          <div className={formStyles.form__upgrade__notice}>
            <h4>⚡ Daily Quota Exceeded</h4>
            <p>
              Upgrade to Pro for unlimited generations and advanced features!
            </p>
            <InstantLink
              href="/subscription"
              className={formStyles.form__upgrade__button}
            >
              Upgrade to Pro 🚀
            </InstantLink>
          </div>
        )}
      </div>
    </Card>
  );
}
