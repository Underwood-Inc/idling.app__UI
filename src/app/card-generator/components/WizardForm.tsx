'use client';

import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card } from '../../components/card/Card';
import { InstantLink } from '../../components/ui/InstantLink';
import {
  aspectRatioSyncAtom,
  avatarSeedAtom,
  currentSeedAtom,
  customAuthorAtom,
  customHeightAtom,
  customQuoteAtom,
  customWidthAtom,
  generatorFormStateAtom,
  selectedRatioAtom,
  shapeCountAtom,
  updateFormStateAtom
} from '../atoms/generatorAtoms';
import { useAspectRatios } from '../hooks/useFormOptions';
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

  // Use Jotai atoms instead of local state
  const [formData] = useAtom(generatorFormStateAtom);
  const [, updateFormData] = useAtom(updateFormStateAtom);
  const [selectedRatio, setSelectedRatio] = useAtom(selectedRatioAtom);
  const [currentSeed, setCurrentSeed] = useAtom(currentSeedAtom);
  const [avatarSeed, setAvatarSeed] = useAtom(avatarSeedAtom);
  const [customAuthor, setCustomAuthor] = useAtom(customAuthorAtom);
  const [customQuote, setCustomQuote] = useAtom(customQuoteAtom);
  const [customWidth, setCustomWidth] = useAtom(customWidthAtom);
  const [customHeight, setCustomHeight] = useAtom(customHeightAtom);
  const [shapeCount, setShapeCount] = useAtom(shapeCountAtom);
  const [, syncAspectRatio] = useAtom(aspectRatioSyncAtom);

  // Use API-based aspect ratios with lazy loading
  const {
    data: aspectRatioData,
    isLoading: aspectRatioLoading,
    fetchIfNeeded
  } = useAspectRatios(true);

  // Convert API response to AspectRatioOption format
  const apiAspectRatios: AspectRatioOption[] =
    aspectRatioData?.aspect_ratios?.map((option) => ({
      key: option.key,
      name: option.name,
      width: option.width,
      height: option.height,
      description: option.description || '',
      dimensions: option.dimensions
    })) || [];

  // Use API data only - no fallbacks
  const effectiveAspectRatios = apiAspectRatios;

  // Fetch aspect ratios when platform step is shown
  useEffect(() => {
    if (currentStep === 'platform') {
      fetchIfNeeded();
    }
  }, [currentStep, fetchIfNeeded]);

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

  /**
   * Handle direct step navigation by clicking on progress circles
   */
  const handleStepClick = (targetStep: WizardStep) => {
    // Don't allow navigation during generation
    if (isGenerating) return;

    // Don't navigate to current step
    if (targetStep === currentStep) return;

    // Validate step access based on current form state and user permissions
    const canNavigateToStep = (step: WizardStep): boolean => {
      switch (step) {
        case 'platform':
          return true; // Can always go back to platform
        case 'basic':
          return true; // Can always access basic if platform is valid
        case 'pro':
          return isAuthenticated && isPro; // Only Pro users can access pro step
        case 'confirm':
          return !!selectedRatio; // Can only confirm if platform is selected
        default:
          return false;
      }
    };

    if (canNavigateToStep(targetStep)) {
      // Expand the wizard if it's collapsed when clicking a step
      if (isCollapsed && onToggleCollapse) {
        onToggleCollapse();
      }

      setCurrentStep(targetStep);
    }
  };

  const handleSubmit = () => {
    const data: WizardFormData = {
      selectedRatio,
      currentSeed,
      avatarSeed,
      customAuthor,
      customQuote,
      customWidth,
      customHeight,
      shapeCount
    };
    onSubmit(data);
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

    // Helper function to determine if a step is clickable
    const isStepClickable = (step: WizardStep): boolean => {
      if (isGenerating) return false;
      if (step === currentStep) return false;

      switch (step) {
        case 'platform':
          return true; // Can always go back to platform
        case 'basic':
          return true; // Can always access basic
        case 'pro':
          return isAuthenticated && isPro; // Only Pro users can access pro step
        case 'confirm':
          return !!selectedRatio; // Can only confirm if platform is selected
        default:
          return false;
      }
    };

    return (
      <div className={wizardStyles.stepIndicator}>
        {steps.map((step, index) => {
          const stepClickable = isStepClickable(step as WizardStep);

          return (
            <div key={step} className={wizardStyles.stepIndicatorItem}>
              <div
                className={`${wizardStyles.stepNumber} ${
                  index <= currentIndex
                    ? wizardStyles.stepActive
                    : wizardStyles.stepInactive
                } ${stepClickable ? wizardStyles.stepClickable : ''}`}
                onClick={() =>
                  stepClickable && handleStepClick(step as WizardStep)
                }
                style={{
                  cursor: stepClickable ? 'pointer' : 'default',
                  userSelect: 'none'
                }}
                title={
                  stepClickable
                    ? `Go to ${
                        step === 'platform'
                          ? 'Platform Selection'
                          : step === 'basic'
                            ? 'Basic Configuration'
                            : step === 'pro'
                              ? 'Pro Configuration'
                              : 'Confirm & Generate'
                      }`
                    : undefined
                }
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
          );
        })}
      </div>
    );
  };

  const renderPlatformStep = () => (
    <div className={wizardStyles.stepContent}>
      <h3>🎯 Choose Your Platform</h3>
      <p>
        Select the platform where you&apos;ll be sharing your card. Each
        platform has optimized dimensions for the best visual impact.
      </p>

      <div className={wizardStyles.ratioGrid}>
        {aspectRatioLoading ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--dark-bg__text-color--secondary)'
            }}
          >
            Loading aspect ratios...
          </div>
        ) : (
          effectiveAspectRatios.map((ratio) => (
            <button
              key={ratio.key}
              className={`${wizardStyles.ratioCard} ${
                selectedRatio.key === ratio.key
                  ? wizardStyles.ratioCardSelected
                  : ''
              }`}
              onClick={() => syncAspectRatio(ratio)}
            >
              <div className={wizardStyles.ratioPreview}>
                <div
                  className={wizardStyles.ratioRectangle}
                  style={{ aspectRatio: `${ratio.width}/${ratio.height}` }}
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
          ))
        )}
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
              value={currentSeed}
              onChange={(e) => setCurrentSeed(e.target.value)}
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
              value={avatarSeed}
              onChange={(e) => setAvatarSeed(e.target.value)}
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
              value={customAuthor}
              onChange={(e) => setCustomAuthor(e.target.value)}
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
              value={customQuote}
              onChange={(e) => setCustomQuote(e.target.value)}
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
      <h3>⚡ Pro Configuration</h3>
      <p>Fine-tune advanced settings with your Pro subscription.</p>

      {!isPro && (
        <div className={wizardStyles.proNotice}>
          <h4>🚀 Upgrade to Pro</h4>
          <p>
            This step contains advanced features available only to Pro
            subscribers. Wizard mode with basic configuration is completely
            free!
          </p>
        </div>
      )}

      <div className={wizardStyles.formGrid}>
        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>📏 Custom Width</span>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              placeholder="Auto"
              min="400"
              max="2000"
              className={wizardStyles.input}
              disabled={!isPro}
            />
            <span className={wizardStyles.fieldHint}>
              Custom width in pixels {!isPro && '(Pro feature)'}
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>📏 Custom Height</span>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              placeholder="Auto"
              min="400"
              max="2000"
              className={wizardStyles.input}
              disabled={!isPro}
            />
            <span className={wizardStyles.fieldHint}>
              Custom height in pixels {!isPro && '(Pro feature)'}
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>🔥 Shape Count</span>
            <input
              type="number"
              value={shapeCount}
              onChange={(e) => setShapeCount(e.target.value)}
              placeholder="8"
              min="3"
              max="15"
              className={wizardStyles.input}
              disabled={!isPro}
            />
            <span className={wizardStyles.fieldHint}>
              Number of background shapes {!isPro && '(Pro feature)'}
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
            {selectedRatio.name} ({selectedRatio.dimensions})
          </p>
        </div>

        <div className={wizardStyles.configSection}>
          <h4>🎨 Content</h4>
          <div className={wizardStyles.configItem}>
            <span>Author:</span>
            <span>{customAuthor || 'Random'}</span>
          </div>
          <div className={wizardStyles.configItem}>
            <span>Quote:</span>
            <span>
              {customQuote
                ? `"${customQuote.substring(0, 50)}${customQuote.length > 50 ? '...' : ''}"`
                : 'Random'}
            </span>
          </div>
        </div>

        <div className={wizardStyles.configSection}>
          <h4>🎲 Seeds</h4>
          <div className={wizardStyles.configItem}>
            <span>Main:</span>
            <span>{currentSeed || 'Random'}</span>
          </div>
          <div className={wizardStyles.configItem}>
            <span>Avatar:</span>
            <span>{avatarSeed || 'Random'}</span>
          </div>
        </div>

        {isAuthenticated &&
          isPro &&
          (customWidth || customHeight || shapeCount !== '8') && (
            <div className={wizardStyles.configSection}>
              <h4>⚡ Pro Settings</h4>
              {customWidth && (
                <div className={wizardStyles.configItem}>
                  <span>Width:</span>
                  <span>{customWidth}px</span>
                </div>
              )}
              {customHeight && (
                <div className={wizardStyles.configItem}>
                  <span>Height:</span>
                  <span>{customHeight}px</span>
                </div>
              )}
              {shapeCount !== '8' && (
                <div className={wizardStyles.configItem}>
                  <span>Shapes:</span>
                  <span>{shapeCount}</span>
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
        return !!selectedRatio;
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
    <Card
      width="full"
      className={`${wizardStyles.wizardContainer} ${isCollapsed ? wizardStyles.wizardContainerCollapsed : ''}`}
    >
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
