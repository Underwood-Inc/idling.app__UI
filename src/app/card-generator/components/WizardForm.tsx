'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Card } from '../../components/card/Card';
import { InstantLink } from '../../components/ui/InstantLink';
import { ASPECT_RATIO_OPTIONS } from '../constants/aspectRatios';
import formStyles from './FormElements.module.css';
import type { AspectRatioOption } from './GenerationForm';
import wizardStyles from './WizardForm.module.css';

export interface WizardFormData {
  // Step 1: Platform/Aspect Ratio
  selectedRatio: AspectRatioOption;

  // Step 2: Basic Configuration
  currentSeed: string;
  avatarSeed: string;
  customAuthor: string;
  customQuote: string;

  // Step 3: Pro Configuration (if user has pro)
  customWidth: string;
  customHeight: string;
  shapeCount: string;
  // Additional pro options can be added here
}

interface WizardFormProps {
  initialData?: Partial<WizardFormData>;
  onSubmit: (data: WizardFormData) => void;
  onCancel?: () => void;
  isGenerating?: boolean;
  isQuotaExceeded?: boolean;
  isPro?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

type WizardStep = 'platform' | 'basic' | 'pro' | 'confirm';

export function WizardForm({
  initialData,
  onSubmit,
  onCancel,
  isGenerating = false,
  isQuotaExceeded = false,
  isPro = false,
  isCollapsed = false,
  onToggleCollapse
}: WizardFormProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user?.id;

  const [currentStep, setCurrentStep] = useState<WizardStep>('platform');
  const [formData, setFormData] = useState<WizardFormData>({
    selectedRatio: initialData?.selectedRatio || ASPECT_RATIO_OPTIONS[0],
    currentSeed: initialData?.currentSeed || '',
    avatarSeed: initialData?.avatarSeed || '',
    customAuthor: initialData?.customAuthor || '',
    customQuote: initialData?.customQuote || '',
    customWidth: initialData?.customWidth || '',
    customHeight: initialData?.customHeight || '',
    shapeCount: initialData?.shapeCount || '8'
  });

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'platform':
        setCurrentStep('basic');
        break;
      case 'basic':
        // Skip pro step if user is not authenticated or doesn't have pro
        setCurrentStep(isAuthenticated && isPro ? 'pro' : 'confirm');
        break;
      case 'pro':
        setCurrentStep('confirm');
        break;
    }
  };

  const handlePrevious = () => {
    switch (currentStep) {
      case 'basic':
        setCurrentStep('platform');
        break;
      case 'pro':
        setCurrentStep('basic');
        break;
      case 'confirm':
        setCurrentStep(isAuthenticated && isPro ? 'pro' : 'basic');
        break;
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'platform':
        return '📐 Choose Platform';
      case 'basic':
        return '🎨 Basic Configuration';
      case 'pro':
        return '⚡ Pro Configuration';
      case 'confirm':
        return '🎯 Confirm & Generate';
      default:
        return 'Card Generator Wizard';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'platform':
        return 'Select the platform and aspect ratio for your card';
      case 'basic':
        return 'Configure the main elements of your card';
      case 'pro':
        return 'Fine-tune advanced settings with Pro features';
      case 'confirm':
        return 'Review your configuration and generate the card';
      default:
        return '';
    }
  };

  const renderStepIndicator = () => {
    const steps = ['platform', 'basic'];
    if (isAuthenticated && isPro) {
      steps.push('pro');
    }
    steps.push('confirm');

    const currentIndex = steps.indexOf(currentStep);

    return (
      <div className={wizardStyles.stepIndicator}>
        {steps.map((step, index) => (
          <div key={step} className={wizardStyles.stepIndicatorItem}>
            <div
              className={`${wizardStyles.stepNumber} ${
                index <= currentIndex
                  ? wizardStyles.stepActive
                  : wizardStyles.stepInactive
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`${wizardStyles.stepLine} ${
                  index < currentIndex
                    ? wizardStyles.stepLineActive
                    : wizardStyles.stepLineInactive
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPlatformStep = () => (
    <div className={wizardStyles.stepContent}>
      <h3>Select Platform & Aspect Ratio</h3>
      <p>
        Choose the platform where you&apos;ll share your card. This determines
        the optimal dimensions.
      </p>

      <div className={wizardStyles.ratioGrid}>
        {ASPECT_RATIO_OPTIONS.map((ratio) => (
          <button
            key={ratio.key}
            className={`${wizardStyles.ratioCard} ${
              formData.selectedRatio.key === ratio.key
                ? wizardStyles.ratioCardSelected
                : ''
            }`}
            onClick={() => updateFormData({ selectedRatio: ratio })}
          >
            <div className={wizardStyles.ratioPreview}>
              <div
                className={wizardStyles.ratioRectangle}
                style={{
                  aspectRatio: `${ratio.width} / ${ratio.height}`
                }}
              />
            </div>
            <div className={wizardStyles.ratioInfo}>
              <h4>{ratio.name}</h4>
              <p>{ratio.description}</p>
              <span className={wizardStyles.ratioDimensions}>
                {ratio.dimensions}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderBasicStep = () => (
    <div className={wizardStyles.stepContent}>
      <h3>Basic Configuration</h3>
      <p>
        Configure the main elements of your card. Leave fields empty for random
        generation.
      </p>

      <div className={wizardStyles.formGrid}>
        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>🎲 Main Seed</span>
            <input
              type="text"
              value={formData.currentSeed}
              onChange={(e) => updateFormData({ currentSeed: e.target.value })}
              placeholder="Leave empty for random"
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>
              Controls the overall design pattern
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>👤 Avatar Seed</span>
            <input
              type="text"
              value={formData.avatarSeed}
              onChange={(e) => updateFormData({ avatarSeed: e.target.value })}
              placeholder="Leave empty for random"
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>
              Controls the avatar design
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>✍️ Author</span>
            <input
              type="text"
              value={formData.customAuthor}
              onChange={(e) => updateFormData({ customAuthor: e.target.value })}
              placeholder="Leave empty for random"
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>
              The person who said the quote
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroupFull}>
          <label>
            <span className={wizardStyles.labelText}>💬 Quote</span>
            <textarea
              value={formData.customQuote}
              onChange={(e) => updateFormData({ customQuote: e.target.value })}
              placeholder="Leave empty for random inspirational quote"
              className={wizardStyles.textarea}
              rows={3}
            />
            <span className={wizardStyles.fieldHint}>
              The inspirational message for your card
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderProStep = () => (
    <div className={wizardStyles.stepContent}>
      <h3>Pro Configuration</h3>
      <p>Fine-tune advanced settings with your Pro subscription.</p>

      <div className={wizardStyles.formGrid}>
        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>📏 Custom Width</span>
            <input
              type="number"
              value={formData.customWidth}
              onChange={(e) => updateFormData({ customWidth: e.target.value })}
              placeholder="Auto"
              min="400"
              max="2000"
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>
              Custom width in pixels
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>📏 Custom Height</span>
            <input
              type="number"
              value={formData.customHeight}
              onChange={(e) => updateFormData({ customHeight: e.target.value })}
              placeholder="Auto"
              min="400"
              max="2000"
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>
              Custom height in pixels
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>🔢 Shape Count</span>
            <input
              type="number"
              value={formData.shapeCount}
              onChange={(e) => updateFormData({ shapeCount: e.target.value })}
              placeholder="8"
              min="0"
              max="20"
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>
              Number of decorative shapes
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className={wizardStyles.stepContent}>
      <h3>Review & Generate</h3>
      <p>Review your configuration and generate your mystical card.</p>

      <div className={wizardStyles.confirmationCard}>
        <div className={wizardStyles.configSection}>
          <h4>📐 Platform</h4>
          <p>
            {formData.selectedRatio.name} ({formData.selectedRatio.dimensions})
          </p>
        </div>

        <div className={wizardStyles.configSection}>
          <h4>🎨 Content</h4>
          <div className={wizardStyles.configItem}>
            <span>Author:</span>
            <span>{formData.customAuthor || 'Random'}</span>
          </div>
          <div className={wizardStyles.configItem}>
            <span>Quote:</span>
            <span>
              {formData.customQuote
                ? `"${formData.customQuote.substring(0, 50)}${formData.customQuote.length > 50 ? '...' : ''}"`
                : 'Random'}
            </span>
          </div>
        </div>

        <div className={wizardStyles.configSection}>
          <h4>🎲 Seeds</h4>
          <div className={wizardStyles.configItem}>
            <span>Main:</span>
            <span>{formData.currentSeed || 'Random'}</span>
          </div>
          <div className={wizardStyles.configItem}>
            <span>Avatar:</span>
            <span>{formData.avatarSeed || 'Random'}</span>
          </div>
        </div>

        {isAuthenticated &&
          isPro &&
          (formData.customWidth ||
            formData.customHeight ||
            formData.shapeCount !== '8') && (
            <div className={wizardStyles.configSection}>
              <h4>⚡ Pro Settings</h4>
              {formData.customWidth && (
                <div className={wizardStyles.configItem}>
                  <span>Width:</span>
                  <span>{formData.customWidth}px</span>
                </div>
              )}
              {formData.customHeight && (
                <div className={wizardStyles.configItem}>
                  <span>Height:</span>
                  <span>{formData.customHeight}px</span>
                </div>
              )}
              {formData.shapeCount !== '8' && (
                <div className={wizardStyles.configItem}>
                  <span>Shapes:</span>
                  <span>{formData.shapeCount}</span>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'platform':
        return renderPlatformStep();
      case 'basic':
        return renderBasicStep();
      case 'pro':
        return renderProStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return null;
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'platform':
        return !!formData.selectedRatio;
      case 'basic':
      case 'pro':
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const showPrevious = currentStep !== 'platform';
  const showNext = currentStep !== 'confirm';
  const showGenerate = currentStep === 'confirm';

  return (
    <Card width="full" className={wizardStyles.wizardContainer}>
      {/* Collapsible Header */}
      <div className={formStyles.form__header}>
        <div className={wizardStyles.wizardHeaderContent}>
          <h2 className={wizardStyles.wizardTitle}>{getStepTitle()}</h2>
          <p className={wizardStyles.wizardDescription}>
            {getStepDescription()}
          </p>
        </div>

        {/* Step Indicator with Collapse Button */}
        <div className={wizardStyles.stepIndicatorContainer}>
          {renderStepIndicator()}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={wizardStyles.wizardCollapseButton}
              title={isCollapsed ? 'Expand wizard' : 'Collapse wizard'}
            >
              <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
              <svg
                className={`${wizardStyles.wizardCollapseChevron} ${
                  isCollapsed
                    ? wizardStyles['wizardCollapseChevron--collapsed']
                    : wizardStyles['wizardCollapseChevron--expanded']
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

      {/* Collapsible Content */}
      <div
        className={`${formStyles.form__collapsible__content} ${
          isCollapsed
            ? formStyles['form__collapsible__content--collapsed']
            : formStyles['form__collapsible__content--expanded']
        }`}
      >
        <div className={wizardStyles.wizardBody}>{renderCurrentStep()}</div>

        <div className={wizardStyles.wizardFooter}>
          {onCancel && (
            <button
              onClick={onCancel}
              className={wizardStyles.cancelButton}
              disabled={isGenerating}
            >
              Cancel
            </button>
          )}

          <div className={wizardStyles.navigationButtons}>
            {showPrevious && (
              <button
                onClick={handlePrevious}
                className={wizardStyles.previousButton}
                disabled={isGenerating}
              >
                ← Previous
              </button>
            )}

            {showNext && (
              <button
                onClick={handleNext}
                className={wizardStyles.nextButton}
                disabled={!canGoNext() || isGenerating}
              >
                Next →
              </button>
            )}

            {showGenerate && (
              <button
                onClick={handleSubmit}
                className={`${wizardStyles.generateButton} ${
                  isQuotaExceeded || isGenerating
                    ? wizardStyles.generateButtonDisabled
                    : ''
                }`}
                disabled={isQuotaExceeded || isGenerating}
              >
                {isGenerating ? '🔮 Generating...' : '⚡ Generate Card'}
              </button>
            )}
          </div>

          {isQuotaExceeded && (
            <div className={wizardStyles.quotaExceededNotice}>
              <h4>⚡ Daily Quota Exceeded</h4>
              <p>
                Upgrade to Pro for unlimited generations and advanced features!
              </p>
              <InstantLink
                href="/subscription"
                className={wizardStyles.upgradeButton}
              >
                Upgrade to Pro 🚀
              </InstantLink>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
