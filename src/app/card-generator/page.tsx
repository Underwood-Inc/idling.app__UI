'use client';

import { useAtom, useSetAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGeneratorMode } from '../../lib/context/UserPreferencesContext';
import type { AspectRatioOption } from '../actions/form-options';
import FadeIn from '../components/fade-in/FadeIn';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import { InteractiveTooltip } from '../components/tooltip/InteractiveTooltip';
import {
  generatorFormStateAtom,
  resetFormAtom,
  updateFormStateAtom
} from './atoms/generatorAtoms';
import { GenerationDisplay } from './components/GenerationDisplay';
import { GenerationForm } from './components/GenerationForm';
import { MysticalLoader } from './components/MysticalLoader';
import { QuotaDisplay } from './components/QuotaDisplay';
import { RegenerationDialog } from './components/RegenerationDialog';
import { WelcomeInterface } from './components/WelcomeInterface';
import { WizardForm } from './components/WizardForm';
import { useAspectRatios } from './hooks/useFormOptions';
import { useFormState } from './hooks/useFormState';
import { useGenerationLoader } from './hooks/useGenerationLoader';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useQuotaTracking } from './hooks/useQuotaTracking';
import { useSubscriptionStatus } from './hooks/useSubscriptionStatus';
import { useWelcomeFlow } from './hooks/useWelcomeFlow';
import styles from './page.module.css';
import { GenerationOptions } from './types/generation';
import {
  convertSvgToPng,
  downloadFile,
  generateFilename
} from './utils/fileUtils';

export default function OgImageViewer() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { mode: generatorMode, setMode: setGeneratorMode } = useGeneratorMode();

  // Core state
  const [svgContent, setSvgContent] = useState<string>('');
  const [selectedRatio, setSelectedRatio] = useState<string>('default');
  const [currentGenerationId, setCurrentGenerationId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoadedGeneration, setIsLoadedGeneration] = useState<boolean>(false);

  // Advanced options state for Pro features
  const [advancedOptions, setAdvancedOptions] = useState<
    Partial<GenerationOptions>
  >({});

  // Jotai atoms for form state
  const [formState] = useAtom(generatorFormStateAtom);
  const resetForm = useSetAtom(resetFormAtom);
  const updateFormState = useSetAtom(updateFormStateAtom);

  // Get aspect ratios from server action
  const { data: aspectRatioData, fetchIfNeeded } = useAspectRatios(false);
  const aspectRatios: AspectRatioOption[] =
    aspectRatioData?.aspect_ratios || [];

  // Custom hooks for clean separation of concerns
  const {
    formState: legacyFormState,
    setFormState,
    updateField,
    clearFormState
  } = useFormState();
  const [isFormCollapsed, setIsFormCollapsed] = useState(true);
  const quotaState = useQuotaTracking();
  const subscriptionStatus = useSubscriptionStatus();
  const welcomeFlow = useWelcomeFlow();

  // Force wizard mode for non-Pro users - override any persisted preferences
  useEffect(() => {
    if (
      session?.user?.id &&
      !subscriptionStatus.isPro &&
      generatorMode === 'advanced'
    ) {
      setGeneratorMode('wizard');
    }
  }, [
    session?.user?.id,
    subscriptionStatus.isPro,
    generatorMode,
    setGeneratorMode
  ]);
  const generationLoader = useGenerationLoader({
    setFormState,
    setSvgContent,
    setSelectedRatio,
    setError,
    // Callback when generation is loaded - keep form collapsed and mark as loaded
    onGenerationLoaded: () => {
      setIsFormCollapsed(true);
      setIsLoadedGeneration(true);
    }
  });

  // Sync aspect ratio changes with form fields
  useEffect(() => {
    const aspectConfig = aspectRatios.find((opt) => opt.key === selectedRatio);
    if (aspectConfig) {
      updateField('customWidth', aspectConfig.width.toString());
      updateField('customHeight', aspectConfig.height.toString());
    }
  }, [selectedRatio, aspectRatios, updateField]);

  // Image generation hook
  const {
    isGenerating,
    generationOptions,
    handleGenerate,
    handleRandomize,
    clearGeneration,
    showRegenerationDialog,
    handleRegenerationChoice,
    handleCloseRegenerationDialog
  } = useImageGeneration({
    currentSeed: formState.currentSeed,
    avatarSeed: formState.avatarSeed,
    selectedRatio: formState.selectedRatio.key,
    customQuote: formState.customQuote,
    customAuthor: formState.customAuthor,
    customWidth: formState.customWidth,
    customHeight: formState.customHeight,
    shapeCount: formState.shapeCount,
    isQuotaExceeded: quotaState.isQuotaExceeded,
    advancedOptions: advancedOptions,
    setCurrentSeed: (seed) => updateFormState({ currentSeed: seed }),
    setAvatarSeed: (seed) => updateFormState({ avatarSeed: seed }),
    setCustomQuote: (quote) => updateFormState({ customQuote: quote }),
    setCustomAuthor: (author) => updateFormState({ customAuthor: author }),
    setCustomWidth: (width) => updateFormState({ customWidth: width }),
    setCustomHeight: (height) => updateFormState({ customHeight: height }),
    setShapeCount: (count) => updateFormState({ shapeCount: count }),
    setCurrentGenerationId: (id) => {
      setCurrentGenerationId(id);
      // Auto-collapse form after successful generation
      if (id) {
        setIsFormCollapsed(true);
        setIsLoadedGeneration(false); // Mark as new generation
      }
    },
    setRemainingGenerations: (count: number, limit?: number) =>
      quotaState.updateQuota(count, limit),
    setHasInitializedQuota: () => {}, // Handled by quota hook
    setSvgContent
  });

  // Handle wizard form submission - now much simpler!
  const handleWizardSubmit = () => {
    // Form data is always current thanks to atoms - no timing issues!
    handleGenerate();
  };

  // ALWAYS clear form when starting new generation - no exceptions
  const handleNewGeneration = () => {
    // FIRST: Clear ALL form state completely
    resetForm();
    setAdvancedOptions({});
    setSelectedRatio('default');
    clearGeneration();

    // SECOND: Clear all generation display state
    setSvgContent('');
    setCurrentGenerationId('');
    setError('');

    // THIRD: Set UI state for new generation
    welcomeFlow.handleNewGeneration();
    setIsFormCollapsed(false);
    setIsLoadedGeneration(false);
  };

  // Handle copy generation ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(currentGenerationId);
  };

  // Handle mode toggle (only for authenticated users)
  const handleModeToggle = () => {
    if (session?.user?.id) {
      const newMode = generatorMode === 'wizard' ? 'advanced' : 'wizard';
      setGeneratorMode(newMode);
    }
  };

  // Handle save as PNG
  const handleSaveAsPng = async () => {
    if (!svgContent) return;

    try {
      const blob = await convertSvgToPng(svgContent);
      const filename = generateFilename(
        'png',
        formState.currentSeed,
        formState.selectedRatio.key
      );
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Error converting to PNG:', error);
    }
  };

  // Handle save as SVG
  const handleSaveAsSvg = () => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const filename = generateFilename(
      'svg',
      formState.currentSeed,
      formState.selectedRatio.key
    );
    downloadFile(blob, filename);
  };

  // Load generation by ID from URL (only for direct links)
  useEffect(() => {
    const generationIdFromUrl = searchParams.get('id');
    if (generationIdFromUrl && generationIdFromUrl !== currentGenerationId) {
      // FIRST: Clear form before loading
      clearFormState();
      setAdvancedOptions({});
      setSelectedRatio('default');
      clearGeneration();
      setSvgContent('');
      setCurrentGenerationId('');
      setError('');

      // SECOND: Load the generation
      generationLoader.loadGeneration(generationIdFromUrl).then((id) => {
        if (id) {
          setCurrentGenerationId(id);
          setIsLoadedGeneration(true); // Mark as loaded generation
        }
      });
    }
  }, [searchParams, currentGenerationId]);

  // Initialize form state on component mount - ensure clean start unless loading generation
  useEffect(() => {
    const generationIdFromUrl = searchParams.get('id');

    // Only clear form if we're not loading a specific generation
    if (!generationIdFromUrl) {
      clearFormState();
      setSelectedRatio('default');
      setAdvancedOptions({});
      setSvgContent('');
      setCurrentGenerationId('');
      setError('');
      setIsLoadedGeneration(false);
      clearGeneration(); // Clear generation hook state including lastGenerationParams
    }
  }, []);

  // Render form based on mode
  const renderForm = () => {
    const isAuthenticated = !!session?.user?.id;
    const shouldUseWizard =
      !isAuthenticated ||
      generatorMode === 'wizard' ||
      !subscriptionStatus.isPro;

    if (shouldUseWizard) {
      return (
        <WizardForm
          onSubmit={handleWizardSubmit}
          isGenerating={isGenerating}
          isQuotaExceeded={quotaState.isQuotaExceeded}
          isPro={subscriptionStatus.isPro}
          isCollapsed={isFormCollapsed}
          onToggleCollapse={
            svgContent ? () => setIsFormCollapsed(!isFormCollapsed) : undefined
          }
        />
      );
    }

    const currentAspectRatio =
      aspectRatios.find((opt) => opt.key === selectedRatio) ||
      (aspectRatios.length > 0
        ? aspectRatios[0]
        : {
            key: 'default',
            name: 'Open Graph (Default)',
            width: 1200,
            height: 630,
            description: 'Standard social media sharing',
            dimensions: '1200×630'
          });

    return (
      <GenerationForm
        currentSeed={legacyFormState.currentSeed}
        setCurrentSeed={(seed) => updateField('currentSeed', seed)}
        avatarSeed={legacyFormState.avatarSeed}
        setAvatarSeed={(seed) => updateField('avatarSeed', seed)}
        customQuote={legacyFormState.customQuote}
        setCustomQuote={(quote) => updateField('customQuote', quote)}
        customAuthor={legacyFormState.customAuthor}
        setCustomAuthor={(author) => updateField('customAuthor', author)}
        customWidth={legacyFormState.customWidth}
        setCustomWidth={(width) => updateField('customWidth', width)}
        customHeight={legacyFormState.customHeight}
        setCustomHeight={(height) => updateField('customHeight', height)}
        shapeCount={legacyFormState.shapeCount}
        setShapeCount={(count) => updateField('shapeCount', count)}
        isQuotaExceeded={quotaState.isQuotaExceeded}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        onRandomize={handleRandomize}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        selectedRatio={currentAspectRatio}
        onRatioChange={(ratio) => setSelectedRatio(ratio.key)}
        aspectRatioOptions={aspectRatios}
        generationOptions={generationOptions}
        advancedOptions={advancedOptions}
        onAdvancedOptionsChange={setAdvancedOptions}
        isProUser={subscriptionStatus.isPro}
        isReadOnly={isLoadedGeneration}
      />
    );
  };

  return (
    <div data-testid="card-generator">
      <PageContainer>
        <PageContent>
          {/* Header moved inside PageContent for proper aside layout constraints */}
          <FadeIn>
            <div
              className={`${styles.header__content} ${styles.header__centered}`}
              style={{ marginBottom: '2rem' }}
            >
              <div className={styles.header__text}>
                <h1>🧙‍♂️ Mystical Card Generator</h1>
                <p>
                  {welcomeFlow.showWelcome
                    ? 'Harness ancient wisdom to forge enchanted social media cards'
                    : 'Channel mystical energies into beautiful social media cards'}
                </p>
              </div>

              {!welcomeFlow.showWelcome && (
                <div className={styles.header__controls}>
                  <div className={styles.header__buttons}>
                    <button
                      onClick={welcomeFlow.returnToWelcome}
                      className={`${styles.header__button} ${styles['header__button--welcome']}`}
                      title="Back to welcome"
                    >
                      ← Welcome
                    </button>

                    {/* Mode Toggle Button - show for all authenticated users */}
                    <InteractiveTooltip
                      content={
                        !subscriptionStatus?.isPro ? (
                          <div style={{ padding: '0.75rem' }}>
                            <strong>🚀 Advanced Mode - Pro Feature</strong>
                            <p
                              style={{
                                margin: '0.5rem 0 0 0',
                                color: 'var(--dark-bg__text-color--secondary)'
                              }}
                            >
                              Unlock the advanced form with direct field access,
                              precise controls, and professional features.
                            </p>
                          </div>
                        ) : undefined
                      }
                      disabled={subscriptionStatus.isPro}
                      triggerOnClick={true}
                    >
                      <button
                        onClick={
                          subscriptionStatus.isPro
                            ? handleModeToggle
                            : undefined
                        }
                        className={`${styles.header__button} ${styles['header__button--mode']} ${
                          !subscriptionStatus.isPro
                            ? styles['header__button--disabled']
                            : ''
                        }`}
                        title={
                          subscriptionStatus.isPro
                            ? `Switch to ${generatorMode === 'wizard' ? 'Advanced' : 'Wizard'} mode`
                            : 'Upgrade to Pro to access Advanced Mode'
                        }
                        disabled={!subscriptionStatus.isPro}
                      >
                        {generatorMode === 'wizard'
                          ? '⚙️ Advanced'
                          : '🪄 Wizard'}
                      </button>
                    </InteractiveTooltip>

                    <button
                      onClick={handleSaveAsPng}
                      className={`${styles.header__button} ${styles['header__button--png']}`}
                      title="PNG - Raster image, best for social media"
                      disabled={!svgContent}
                    >
                      📥 PNG
                    </button>
                    <button
                      onClick={handleSaveAsSvg}
                      className={`${styles.header__button} ${styles['header__button--svg']}`}
                      title="SVG - Vector image, scalable and smaller"
                      disabled={!svgContent}
                    >
                      📥 SVG
                    </button>
                  </div>

                  {/* Mobile Quota Display - moved outside buttons container for better alignment */}
                  <div className={styles.quota__mobile}>
                    <QuotaDisplay
                      remainingGenerations={quotaState.remainingGenerations}
                      quotaLimit={quotaState.quotaLimit}
                      resetDate={quotaState.resetDate}
                      hasInitializedQuota={quotaState.hasInitializedQuota}
                      isQuotaExceeded={quotaState.isQuotaExceeded}
                      mobile={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
          {/* Show welcome interface when appropriate */}
          {welcomeFlow.showWelcome ? (
            <WelcomeInterface
              remainingGenerations={quotaState.remainingGenerations}
              quotaLimit={quotaState.quotaLimit}
              hasInitializedQuota={quotaState.hasInitializedQuota}
              isQuotaExceeded={quotaState.isQuotaExceeded}
              resetDate={quotaState.resetDate}
              loadGenerationId={welcomeFlow.loadGenerationId}
              setLoadGenerationId={welcomeFlow.setLoadGenerationId}
              onNewGeneration={handleNewGeneration}
              onLoadGeneration={welcomeFlow.handleLoadGeneration}
            />
          ) : (
            <article className={styles.viewer__container}>
              <FadeIn className={styles.viewer__container_fade}>
                <div className={styles.viewer__form}>{renderForm()}</div>

                {/* Mystical Loader */}
                {isGenerating && <MysticalLoader />}

                {/* Error Display */}
                {error && (
                  <div className={styles.error__container}>
                    <p className={styles.error__message}>{error}</p>
                  </div>
                )}

                {/* Generation Display */}
                {svgContent && (
                  <GenerationDisplay
                    generationId={currentGenerationId}
                    svgContent={svgContent}
                    onCopyId={handleCopyId}
                  />
                )}

                {/* Regeneration Dialog */}
                {showRegenerationDialog && (
                  <RegenerationDialog
                    isOpen={showRegenerationDialog}
                    onChoice={handleRegenerationChoice}
                    onClose={handleCloseRegenerationDialog}
                  />
                )}
              </FadeIn>
            </article>
          )}
        </PageContent>

        <PageAside>
          <QuotaDisplay
            remainingGenerations={quotaState.remainingGenerations}
            quotaLimit={quotaState.quotaLimit}
            resetDate={quotaState.resetDate}
            hasInitializedQuota={quotaState.hasInitializedQuota}
            isQuotaExceeded={quotaState.isQuotaExceeded}
          />
        </PageAside>
      </PageContainer>
    </div>
  );
}
