'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { useToolsCopy } from '../../tools/ToolsCopyContext';
import { COMMON_EN } from '$i18n-source/common.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { useIdlingLocale } from '../../components/locale/IdlingLocaleProvider';
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
  const { cardGenerator } = useToolsCopy();
  const w = cardGenerator.wizard;
  const { ll } = useIdlingLocale();
  const common = useMemo(
    () => resolveCatalogFromLl(COMMON_EN, ll.common as Record<string, unknown>),
    [ll]
  );
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

  const getStepTitle = (): ReactNode => {
    switch (currentStep) {
      case 'platform':
        return (
          <>
            <SiteIcon id="layout" sizeRem={1.125} />
            {w.steps.platformSelection}
          </>
        );
      case 'basic':
        return (
          <>
            <SiteIcon id="palette" sizeRem={1.125} />
            {w.steps.basicConfiguration}
          </>
        );
      case 'pro':
        return (
          <>
            <SiteIcon id="zap" sizeRem={1.125} />
            {w.steps.proConfiguration}
          </>
        );
      case 'confirm':
        return (
          <>
            <SiteIcon id="target" sizeRem={1.125} />
            {w.steps.confirmAndGenerate}
          </>
        );
      default:
        return w.wizardTitle;
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'platform':
        return w.stepDescriptions.platform;
      case 'basic':
        return w.stepDescriptions.basic;
      case 'pro':
        return w.stepDescriptions.pro;
      case 'confirm':
        return w.stepDescriptions.confirm;
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
                    ? `${w.goToStepPrefix} ${
                        step === 'platform'
                          ? w.steps.platformSelection
                          : step === 'basic'
                            ? w.steps.basicConfiguration
                            : step === 'pro'
                              ? w.steps.proConfiguration
                              : w.steps.confirmAndGenerate
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
      <h3>
        <SiteIcon id="target" sizeRem={1.125} />
        {w.choosePlatformTitle}
      </h3>
      <p>{w.choosePlatformBody}</p>

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
            {w.loadingAspectRatios}
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
      <h3>{w.steps.basicConfiguration}</h3>
      <p>
        {w.stepDescriptions.basic} {w.basicEmptyNote}
      </p>

      <div className={wizardStyles.formGrid}>
        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>
              <SiteIcon id="dices" sizeRem={1} />
              {w.labels.mainSeed}
            </span>
            <input
              type="text"
              value={currentSeed}
              onChange={(e) => setCurrentSeed(e.target.value)}
              placeholder={w.placeholders.random}
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>{w.hints.pattern}</span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>
              <SiteIcon id="user" sizeRem={1} />
              {w.labels.avatarSeed}
            </span>
            <input
              type="text"
              value={avatarSeed}
              onChange={(e) => setAvatarSeed(e.target.value)}
              placeholder={w.placeholders.random}
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>{w.hints.avatar}</span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>
              <SiteIcon id="pen" sizeRem={1} />
              {w.labels.author}
            </span>
            <input
              type="text"
              value={customAuthor}
              onChange={(e) => setCustomAuthor(e.target.value)}
              placeholder={w.placeholders.random}
              className={wizardStyles.input}
            />
            <span className={wizardStyles.fieldHint}>{w.hints.author}</span>
          </label>
        </div>

        <div className={wizardStyles.formGroupFull}>
          <label>
            <span className={wizardStyles.labelText}>
              <SiteIcon id="messages" sizeRem={1} />
              {w.labels.quote}
            </span>
            <textarea
              value={customQuote}
              onChange={(e) => setCustomQuote(e.target.value)}
              placeholder={w.placeholders.randomQuote}
              className={wizardStyles.textarea}
              rows={3}
            />
            <span className={wizardStyles.fieldHint}>{w.hints.quote}</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderProStep = () => (
    <div className={wizardStyles.stepContent}>
      <h3>
        <SiteIcon id="zap" sizeRem={1.125} />
        {w.steps.proConfiguration}
      </h3>
      <p>{w.stepDescriptions.pro}</p>

      {!isPro && (
        <div className={wizardStyles.proNotice}>
          <h4>
            <SiteIcon id="rocket" sizeRem={1} />
            {w.proStep.upgradeTitle}
          </h4>
          <p>{w.proStep.upgradeBody}</p>
        </div>
      )}

      <div className={wizardStyles.formGrid}>
        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>
              <SiteIcon id="layout" sizeRem={1} />
              {w.labels.customWidth}
            </span>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              placeholder={w.placeholders.auto}
              min="400"
              max="2000"
              className={wizardStyles.input}
              disabled={!isPro}
            />
            <span className={wizardStyles.fieldHint}>
              {w.proStep.widthHint} {!isPro && w.proStep.proFeatureSuffix}
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>
              <SiteIcon id="layout" sizeRem={1} />
              {w.labels.customHeight}
            </span>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              placeholder={w.placeholders.auto}
              min="400"
              max="2000"
              className={wizardStyles.input}
              disabled={!isPro}
            />
            <span className={wizardStyles.fieldHint}>
              {w.proStep.heightHint} {!isPro && w.proStep.proFeatureSuffix}
            </span>
          </label>
        </div>

        <div className={wizardStyles.formGroup}>
          <label>
            <span className={wizardStyles.labelText}>
              <SiteIcon id="flame" sizeRem={1} />
              {w.labels.shapeCount}
            </span>
            <input
              type="number"
              value={shapeCount}
              onChange={(e) => setShapeCount(e.target.value)}
              placeholder={w.proStep.shapeCountPlaceholder}
              min="3"
              max="15"
              className={wizardStyles.input}
              disabled={!isPro}
            />
            <span className={wizardStyles.fieldHint}>
              {w.proStep.shapeCountHint} {!isPro && w.proStep.proFeatureSuffix}
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderConfirmStep = () => {
    const c = w.confirmStep;
    const random = c.randomValue;

    return (
      <div className={wizardStyles.stepContent}>
        <h3>{w.reviewTitle}</h3>
        <p>{c.body}</p>

        <div className={wizardStyles.confirmationCard}>
          <div className={wizardStyles.configSection}>
            <h4>
              <SiteIcon id="layout" sizeRem={1} />
              {c.sections.platform}
            </h4>
            <div className={wizardStyles.configItem}>
              <span>{c.labels.format}</span>
              <span>{selectedRatio.name}</span>
            </div>
            <div className={wizardStyles.configItem}>
              <span>{c.labels.dimensions}</span>
              <span>{selectedRatio.dimensions}</span>
            </div>
          </div>

          <div className={wizardStyles.configSection}>
            <h4>
              <SiteIcon id="palette" sizeRem={1} />
              {c.sections.content}
            </h4>
            <div className={wizardStyles.configItem}>
              <span>{c.labels.author}</span>
              <span>{customAuthor || random}</span>
            </div>
            <div className={wizardStyles.configItem}>
              <span>{c.labels.quote}</span>
              <span>
                {customQuote
                  ? `"${customQuote.substring(0, 50)}${customQuote.length > 50 ? '...' : ''}"`
                  : random}
              </span>
            </div>
          </div>

          <div className={wizardStyles.configSection}>
            <h4>
              <SiteIcon id="dices" sizeRem={1} />
              {c.sections.seeds}
            </h4>
            <div className={wizardStyles.configItem}>
              <span>{c.labels.main}</span>
              <span>{currentSeed || random}</span>
            </div>
            <div className={wizardStyles.configItem}>
              <span>{c.labels.avatar}</span>
              <span>{avatarSeed || random}</span>
            </div>
          </div>

          {isAuthenticated &&
            isPro &&
            (customWidth || customHeight || shapeCount !== '8') && (
              <div className={wizardStyles.configSection}>
                <h4>
                  <SiteIcon id="zap" sizeRem={1} />
                  {c.sections.proSettings}
                </h4>
                {customWidth && (
                  <div className={wizardStyles.configItem}>
                    <span>{c.labels.width}</span>
                    <span>{customWidth}px</span>
                  </div>
                )}
                {customHeight && (
                  <div className={wizardStyles.configItem}>
                    <span>{c.labels.height}</span>
                    <span>{customHeight}px</span>
                  </div>
                )}
                {shapeCount !== '8' && (
                  <div className={wizardStyles.configItem}>
                    <span>{c.labels.shapes}</span>
                    <span>{shapeCount}</span>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    );
  };

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
              <span>{isCollapsed ? common.actions.expand : common.actions.collapse}</span>
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
              {w.cancel}
            </button>
          )}

          <div className={wizardStyles.navigationButtons}>
            {showPrevious && (
              <button
                onClick={handlePrevious}
                className={wizardStyles.previousButton}
                disabled={isGenerating}
              >
                {w.previous}
              </button>
            )}

            {showNext && (
              <button
                onClick={handleNext}
                className={wizardStyles.nextButton}
                disabled={!canGoNext() || isGenerating}
              >
                {w.next}
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
                {isGenerating ? (
                  <>
                    <SiteIcon id="sparkles" sizeRem={1} />
                    {w.generating}
                  </>
                ) : (
                  <>
                    <SiteIcon id="zap" sizeRem={1} />
                    {w.generateCard}
                  </>
                )}
              </button>
            )}
          </div>

          {isQuotaExceeded && (
            <div className={wizardStyles.quotaExceededNotice}>
              <h4>
                <SiteIcon id="zap" sizeRem={1.125} />
                {w.dailyQuotaExceeded}
              </h4>
              <p>{w.upgradeForUnlimited}</p>
              <InstantLink
                href="/subscription"
                className={wizardStyles.upgradeButton}
              >
                <>
                  {cardGenerator.welcome.upgradeCta}
                  <SiteIcon id="rocket" sizeRem={0.875} />
                </>
              </InstantLink>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
