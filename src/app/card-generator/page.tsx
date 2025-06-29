'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FadeIn from '../components/fade-in/FadeIn';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { GenerationDisplay } from './components/GenerationDisplay';
import { GenerationForm } from './components/GenerationForm';
import { QuotaDisplay } from './components/QuotaDisplay';
import { WelcomeInterface } from './components/WelcomeInterface';
import { ASPECT_RATIO_OPTIONS } from './constants/aspectRatios';
import { useFormState } from './hooks/useFormState';
import { useGenerationLoader } from './hooks/useGenerationLoader';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useQuotaTracking } from './hooks/useQuotaTracking';
import { useWelcomeFlow } from './hooks/useWelcomeFlow';
import styles from './page.module.css';
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

  // Custom hooks for clean separation of concerns
  const { formState, setFormState, updateField } = useFormState();
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const quotaState = useQuotaTracking();
  const welcomeFlow = useWelcomeFlow();
  const generationLoader = useGenerationLoader({
    setFormState,
    setSvgContent,
    setSelectedRatio,
    setError
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
  const { isGenerating, generationOptions, handleGenerate, handleRandomize } =
    useImageGeneration({
      currentSeed: formState.currentSeed,
      avatarSeed: formState.avatarSeed,
      selectedRatio,
      customQuote: formState.customQuote,
      customAuthor: formState.customAuthor,
      customWidth: formState.customWidth,
      customHeight: formState.customHeight,
      shapeCount: formState.shapeCount,
      isQuotaExceeded: quotaState.isQuotaExceeded,
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
        }
      },
      setRemainingGenerations: quotaState.updateQuota,
      setHasInitializedQuota: () => {}, // Handled by quota hook
      setSvgContent
    });

  // Handle copy generation ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(currentGenerationId);
  };

  // Load generation by ID from URL (only for direct links)
  useEffect(() => {
    const generationIdFromUrl = searchParams.get('id');
    if (generationIdFromUrl && generationIdFromUrl !== currentGenerationId) {
      generationLoader.loadGeneration(generationIdFromUrl).then((id) => {
        if (id) {
          setCurrentGenerationId(id);
        }
      });
    }
  }, [searchParams, currentGenerationId]);

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

  // Loading states
  if (generationLoader.isLoading) {
    return (
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Card Generator</h2>
            <p>Loading generation...</p>
          </FadeIn>
        </PageHeader>
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
                <AspectRatioSelector
                  selectedRatio={selectedRatio}
                  onRatioChange={setSelectedRatio}
                  options={ASPECT_RATIO_OPTIONS}
                  disabled={quotaState.isQuotaExceeded}
                />
                <div className={styles.header__buttons}>
                  <button
                    onClick={welcomeFlow.returnToWelcome}
                    className={styles.header__button}
                    title="Back to welcome"
                  >
                    ← Welcome
                  </button>
                  <button
                    onClick={handleSaveAsPng}
                    className={styles.header__button}
                    title="PNG - Raster image, best for social media"
                    disabled={!svgContent}
                  >
                    📥 PNG
                  </button>
                  <button
                    onClick={handleSaveAsSvg}
                    className={styles.header__button}
                    title="SVG - Vector image, scalable and smaller"
                    disabled={!svgContent}
                  >
                    📥 SVG
                  </button>
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
              hasInitializedQuota={quotaState.hasInitializedQuota}
              isQuotaExceeded={quotaState.isQuotaExceeded}
              loadGenerationId={welcomeFlow.loadGenerationId}
              setLoadGenerationId={welcomeFlow.setLoadGenerationId}
              onNewGeneration={welcomeFlow.handleNewGeneration}
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
                generationOptions={generationOptions}
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
            hasInitializedQuota={quotaState.hasInitializedQuota}
            isQuotaExceeded={quotaState.isQuotaExceeded}
            showMeter={welcomeFlow.showWelcome}
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
    </PageContainer>
  );
}
