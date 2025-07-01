'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FadeIn from '../components/fade-in/FadeIn';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import { GenerationDisplay } from './components/GenerationDisplay';
import { GenerationForm } from './components/GenerationForm';
import { QuotaDisplay } from './components/QuotaDisplay';
import { RegenerationDialog } from './components/RegenerationDialog';
import { WelcomeInterface } from './components/WelcomeInterface';
import { ASPECT_RATIO_OPTIONS } from './constants/aspectRatios';
import { useFormState } from './hooks/useFormState';
import { useGenerationLoader } from './hooks/useGenerationLoader';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useQuotaTracking } from './hooks/useQuotaTracking';
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
  }, []); // Run only once on mount

  // Download handlers
  const handleSaveAsPng = async () => {
    try {
      const pngBlob = await convertSvgToPng(svgContent);
      downloadFile(
        pngBlob,
        generateFilename('png', formState.currentSeed, selectedRatio)
      );
    } catch (err) {
      setError('Failed to convert to PNG. Please try again.');
    }
  };

  const handleSaveAsSvg = () => {
    if (!svgContent) {
      setError('No SVG content available');
      return;
    }

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadFile(
      svgBlob,
      generateFilename('svg', formState.currentSeed, selectedRatio)
    );
  };

  // ALWAYS clear form and image when returning to welcome - no exceptions
  useEffect(() => {
    if (welcomeFlow.showWelcome) {
      // Force clear ALL state when returning to welcome - no conditions
      clearFormState();
      clearGeneration();
      setSvgContent('');
      setCurrentGenerationId('');
      setSelectedRatio('default');
      setError('');
      setIsFormCollapsed(true);
      setIsLoadedGeneration(false);
      setAdvancedOptions({});
    }
  }, [welcomeFlow.showWelcome]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear all state when component unmounts (navigation away from page)
      clearFormState();
      clearGeneration();
      welcomeFlow.clearWelcomeFlow();
      setSvgContent('');
      setCurrentGenerationId('');
      setError('');
    };
  }, [clearFormState, clearGeneration, welcomeFlow.clearWelcomeFlow]);

  // Loading states
  if (generationLoader.isLoading) {
    return (
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Card Generator</h2>
            <p>🔮 Loading your mystical creation...</p>
          </FadeIn>
        </PageHeader>
        <PageContent>
          <div className={styles.loading__container}>
            <div className={styles.loading__spinner}>⚡</div>
            <p className={styles.loading__message}>
              Summoning your previous generation from the ancient archives...
            </p>
          </div>
        </PageContent>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Card Generator</h2>
            <p>Error: {error}</p>
            <button
              onClick={() => setError('')}
              className={styles.header__button}
            >
              Try Again
            </button>
          </FadeIn>
        </PageHeader>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <FadeIn>
          <div
            className={`${styles.header__content} ${welcomeFlow.showWelcome ? styles.header__centered : ''}`}
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
                  <div className={styles.mobile__quota__display}>
                    <QuotaDisplay
                      remainingGenerations={quotaState.remainingGenerations}
                      quotaLimit={quotaState.quotaLimit}
                      hasInitializedQuota={quotaState.hasInitializedQuota}
                      isQuotaExceeded={quotaState.isQuotaExceeded}
                      showMeter
                      mobile
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      </PageHeader>

      <PageContent>
        {welcomeFlow.showWelcome ? (
          <FadeIn>
            <WelcomeInterface
              remainingGenerations={quotaState.remainingGenerations}
              quotaLimit={quotaState.quotaLimit}
              hasInitializedQuota={quotaState.hasInitializedQuota}
              isQuotaExceeded={quotaState.isQuotaExceeded}
              loadGenerationId={welcomeFlow.loadGenerationId}
              setLoadGenerationId={welcomeFlow.setLoadGenerationId}
              onNewGeneration={handleNewGeneration}
              onLoadGeneration={welcomeFlow.handleLoadGeneration}
            />
          </FadeIn>
        ) : (
          <article className={styles.viewer__container}>
            <FadeIn className={styles.viewer__container_fade}>
              <GenerationForm
                currentSeed={formState.currentSeed}
                setCurrentSeed={(seed) => updateField('currentSeed', seed)}
                avatarSeed={formState.avatarSeed}
                setAvatarSeed={(seed) => updateField('avatarSeed', seed)}
                customQuote={formState.customQuote}
                setCustomQuote={(quote) => updateField('customQuote', quote)}
                customAuthor={formState.customAuthor}
                setCustomAuthor={(author) =>
                  updateField('customAuthor', author)
                }
                customWidth={formState.customWidth}
                setCustomWidth={(width) => updateField('customWidth', width)}
                customHeight={formState.customHeight}
                setCustomHeight={(height) =>
                  updateField('customHeight', height)
                }
                shapeCount={formState.shapeCount}
                setShapeCount={(count) => updateField('shapeCount', count)}
                isQuotaExceeded={quotaState.isQuotaExceeded}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                onRandomize={handleRandomize}
                isCollapsed={isFormCollapsed}
                onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
                selectedRatio={
                  ASPECT_RATIO_OPTIONS.find((r) => r.key === selectedRatio) ||
                  ASPECT_RATIO_OPTIONS[0]
                }
                onRatioChange={(ratio) => setSelectedRatio(ratio.key)}
                aspectRatioOptions={ASPECT_RATIO_OPTIONS}
                generationOptions={generationOptions}
                advancedOptions={advancedOptions}
                onAdvancedOptionsChange={setAdvancedOptions}
                isProUser={false} // TODO: Connect to actual Pro user status
                isReadOnly={isLoadedGeneration}
              />

              <GenerationDisplay
                generationId={currentGenerationId}
                svgContent={svgContent}
                onCopyId={handleCopyId}
              />
            </FadeIn>
          </article>
        )}
      </PageContent>

      <PageAside className={styles.features_aside} bottomMargin={10}>
        <FadeIn>
          <QuotaDisplay
            remainingGenerations={quotaState.remainingGenerations}
            quotaLimit={quotaState.quotaLimit}
            hasInitializedQuota={quotaState.hasInitializedQuota}
            isQuotaExceeded={quotaState.isQuotaExceeded}
            showMeter
          />

          {/* Mystical Codex */}
          <div className={styles.features__section}>
            <h3>📜 Arcane Knowledge</h3>
            <div className={styles.features__grid}>
              <div className={styles.feature__card}>
                <h4>
                  <span className={styles.feature__icon}>🎯</span>
                  Pro Tips
                </h4>
                <p>
                  Use custom seeds for reproducible results. Save your
                  Generation ID to recreate cards later!
                </p>
              </div>
              <div className={styles.feature__card}>
                <h4>
                  <span className={styles.feature__icon}>⚙️</span>
                  Advanced Magic
                </h4>
                <p>
                  Unlock custom quotes, dimensions, and shape counts with Pro
                  subscription for unlimited creativity.
                </p>
              </div>
              <div className={styles.feature__card}>
                <h4>
                  <span className={styles.feature__icon}>📱</span>
                  Perfect Formats
                </h4>
                <p>
                  Choose from 7+ aspect ratios: Instagram, YouTube, LinkedIn,
                  Twitter, Facebook, and more!
                </p>
              </div>
              <div className={styles.feature__card}>
                <h4>
                  <span className={styles.feature__icon}>💾</span>
                  Export Options
                </h4>
                <p>
                  Download as PNG for social media or SVG for scalable vector
                  graphics. Both formats supported!
                </p>
              </div>
              <div className={styles.feature__card}>
                <h4>
                  <span className={styles.feature__icon}>🔄</span>
                  Generation History
                </h4>
                <p>
                  Every creation gets a unique ID. Load previous generations
                  anytime using the ID lookup feature.
                </p>
              </div>
              <div className={styles.feature__card}>
                <h4>
                  <span className={styles.feature__icon}>🎨</span>
                  Sacred Geometry
                </h4>
                <p>
                  Algorithmically generated patterns based on mathematical
                  principles and mystical symbolism.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </PageAside>

      {/* Regeneration Dialog */}
      <RegenerationDialog
        isOpen={showRegenerationDialog}
        onChoice={handleRegenerationChoice}
        onClose={handleCloseRegenerationDialog}
      />
    </PageContainer>
  );
}
