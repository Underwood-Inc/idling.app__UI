'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGeneratorMode } from '../../lib/context/UserPreferencesContext';
import FadeIn from '../components/fade-in/FadeIn';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import { GenerationDisplay } from './components/GenerationDisplay';
import { GenerationForm } from './components/GenerationForm';
import { MysticalLoader } from './components/MysticalLoader';
import { QuotaDisplay } from './components/QuotaDisplay';
import { RegenerationDialog } from './components/RegenerationDialog';
import { WelcomeInterface } from './components/WelcomeInterface';
import { WizardForm, type WizardFormData } from './components/WizardForm';
import { ASPECT_RATIO_OPTIONS } from './constants/aspectRatios';
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

  // Custom hooks for clean separation of concerns
  const { formState, setFormState, updateField, clearFormState } =
    useFormState();
  const [isFormCollapsed, setIsFormCollapsed] = useState(true);
  const quotaState = useQuotaTracking();
  const subscriptionStatus = useSubscriptionStatus();
  const welcomeFlow = useWelcomeFlow();
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
    const aspectConfig = ASPECT_RATIO_OPTIONS.find(
      (opt) => opt.key === selectedRatio
    );
    if (aspectConfig) {
      updateField('customWidth', aspectConfig.width.toString());
      updateField('customHeight', aspectConfig.height.toString());
    }
  }, [selectedRatio, updateField]);

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
    selectedRatio,
    customQuote: formState.customQuote,
    customAuthor: formState.customAuthor,
    customWidth: formState.customWidth,
    customHeight: formState.customHeight,
    shapeCount: formState.shapeCount,
    isQuotaExceeded: quotaState.isQuotaExceeded,
    advancedOptions: advancedOptions,
    setCurrentSeed: (seed) => updateField('currentSeed', seed),
    setAvatarSeed: (seed) => updateField('avatarSeed', seed),
    setCustomQuote: (quote) => updateField('customQuote', quote),
    setCustomAuthor: (author) => updateField('customAuthor', author),
    setCustomWidth: (width) => updateField('customWidth', width),
    setCustomHeight: (height) => updateField('customHeight', height),
    setShapeCount: (count) => updateField('shapeCount', count),
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

  // Handle wizard form submission
  const handleWizardSubmit = (wizardData: WizardFormData) => {
    // Convert wizard data to form state
    setFormState({
      currentSeed: wizardData.currentSeed,
      avatarSeed: wizardData.avatarSeed,
      customQuote: wizardData.customQuote,
      customAuthor: wizardData.customAuthor,
      customWidth: wizardData.customWidth,
      customHeight: wizardData.customHeight,
      shapeCount: wizardData.shapeCount
    });

    // Set the selected ratio
    setSelectedRatio(wizardData.selectedRatio.key);

    // Trigger generation
    handleGenerate();
  };

  // ALWAYS clear form when starting new generation - no exceptions
  const handleNewGeneration = () => {
    // FIRST: Clear ALL form state completely
    clearFormState();
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
        selectedRatio
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
      selectedRatio
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
    const shouldUseWizard = !isAuthenticated || generatorMode === 'wizard';

    if (shouldUseWizard) {
      const selectedRatioObj =
        ASPECT_RATIO_OPTIONS.find((opt) => opt.key === selectedRatio) ||
        ASPECT_RATIO_OPTIONS[0];

      return (
        <WizardForm
          initialData={{
            selectedRatio: selectedRatioObj,
            currentSeed: formState.currentSeed,
            avatarSeed: formState.avatarSeed,
            customAuthor: formState.customAuthor,
            customQuote: formState.customQuote,
            customWidth: formState.customWidth,
            customHeight: formState.customHeight,
            shapeCount: formState.shapeCount
          }}
          onSubmit={handleWizardSubmit}
          isGenerating={isGenerating}
          isQuotaExceeded={quotaState.isQuotaExceeded}
          isPro={subscriptionStatus.isPro}
          isCollapsed={isFormCollapsed}
          onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        />
      );
    }

    return (
      <GenerationForm
        currentSeed={formState.currentSeed}
        setCurrentSeed={(seed) => updateField('currentSeed', seed)}
        avatarSeed={formState.avatarSeed}
        setAvatarSeed={(seed) => updateField('avatarSeed', seed)}
        customQuote={formState.customQuote}
        setCustomQuote={(quote) => updateField('customQuote', quote)}
        customAuthor={formState.customAuthor}
        setCustomAuthor={(author) => updateField('customAuthor', author)}
        customWidth={formState.customWidth}
        setCustomWidth={(width) => updateField('customWidth', width)}
        customHeight={formState.customHeight}
        setCustomHeight={(height) => updateField('customHeight', height)}
        shapeCount={formState.shapeCount}
        setShapeCount={(count) => updateField('shapeCount', count)}
        isQuotaExceeded={quotaState.isQuotaExceeded}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        onRandomize={handleRandomize}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        selectedRatio={
          ASPECT_RATIO_OPTIONS.find((opt) => opt.key === selectedRatio) ||
          ASPECT_RATIO_OPTIONS[0]
        }
        onRatioChange={(ratio) => setSelectedRatio(ratio.key)}
        aspectRatioOptions={ASPECT_RATIO_OPTIONS}
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
        <PageHeader>
          <FadeIn>
            <div
              className={`${styles.header__content} ${styles.header__centered}`}
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

                    {/* Mode Toggle Button (only for authenticated users) */}
                    {session?.user?.id && (
                      <button
                        onClick={handleModeToggle}
                        className={`${styles.header__button} ${styles['header__button--mode']}`}
                        title={`Switch to ${generatorMode === 'wizard' ? 'Advanced' : 'Wizard'} mode`}
                      >
                        {generatorMode === 'wizard'
                          ? '⚙️ Advanced'
                          : '🪄 Wizard'}
                      </button>
                    )}

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
                    {/* Mobile Quota Display - only visible when aside is hidden */}
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
                </div>
              )}
            </div>
          </FadeIn>
        </PageHeader>

        <PageContent>
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
