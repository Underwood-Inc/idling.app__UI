import { noCacheFetch } from '@lib/utils/no-cache-fetch';
import { formatRetryAfter } from '@lib/utils/timeFormatting';
import { useCallback, useRef, useState } from 'react';
import { GenerationOptions } from '../types/generation';

interface UseImageGenerationProps {
  currentSeed: string;
  avatarSeed: string;
  selectedRatio: string;
  customQuote: string;
  customAuthor: string;
  customWidth: string;
  customHeight: string;
  shapeCount: string;
  isQuotaExceeded: boolean;
  // Advanced options for Pro features
  advancedOptions?: Partial<GenerationOptions>;
  setCurrentSeed: (seed: string) => void;
  setAvatarSeed: (seed: string) => void;
  setCustomQuote: (quote: string) => void;
  setCustomAuthor: (author: string) => void;
  setCustomWidth: (width: string) => void;
  setCustomHeight: (height: string) => void;
  setShapeCount: (count: string) => void;
  setCurrentGenerationId: (id: string) => void;
  setRemainingGenerations: (count: number, limit?: number) => void;
  setHasInitializedQuota: (initialized: boolean) => void;
  setSvgContent: (content: string) => void;
}

// Override values for direct wizard submission
interface GenerationOverrides {
  currentSeed?: string;
  avatarSeed?: string;
  selectedRatio?: string;
  customQuote?: string;
  customAuthor?: string;
  customWidth?: string;
  customHeight?: string;
  shapeCount?: string;
}

interface FormSnapshot {
  currentSeed: string;
  avatarSeed: string;
  selectedRatio: string;
  customQuote: string;
  customAuthor: string;
  customWidth: string;
  customHeight: string;
  shapeCount: string;
}

export function useImageGeneration(props: UseImageGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [generationOptions, setGenerationOptions] = useState<any>(null);
  const [showRegenerationDialog, setShowRegenerationDialog] = useState(false);

  // Track the last generation parameters for comparison
  const lastGenerationParams = useRef<FormSnapshot | null>(null);

  // Create current form snapshot
  const getCurrentFormSnapshot = useCallback(
    (): FormSnapshot => ({
      currentSeed: props.currentSeed,
      avatarSeed: props.avatarSeed,
      selectedRatio: props.selectedRatio,
      customQuote: props.customQuote,
      customAuthor: props.customAuthor,
      customWidth: props.customWidth,
      customHeight: props.customHeight,
      shapeCount: props.shapeCount
    }),
    [props]
  );

  // Compare form snapshots
  const areFormSnapshotsEqual = useCallback(
    (a: FormSnapshot, b: FormSnapshot): boolean => {
      return (
        a.currentSeed === b.currentSeed &&
        a.avatarSeed === b.avatarSeed &&
        a.selectedRatio === b.selectedRatio &&
        a.customQuote === b.customQuote &&
        a.customAuthor === b.customAuthor &&
        a.customWidth === b.customWidth &&
        a.customHeight === b.customHeight &&
        a.shapeCount === b.shapeCount
      );
    },
    []
  );

  // Internal generation function
  const performGeneration = useCallback(
    async (forceRandom = false, overrides?: GenerationOverrides) => {
      if (props.isQuotaExceeded) {
        setError(
          'Daily quota exceeded. Please upgrade to Pro for unlimited generations.'
        );
        return;
      }

      setIsGenerating(true);
      setError('');

      try {
        // Build URL with ALL parameters
        const params = new URLSearchParams();

        // Use override values if provided, otherwise use props
        const currentSeed = overrides?.currentSeed ?? props.currentSeed;
        const avatarSeed = overrides?.avatarSeed ?? props.avatarSeed;
        const selectedRatio = overrides?.selectedRatio ?? props.selectedRatio;
        const customQuote = overrides?.customQuote ?? props.customQuote;
        const customAuthor = overrides?.customAuthor ?? props.customAuthor;
        const customWidth = overrides?.customWidth ?? props.customWidth;
        const customHeight = overrides?.customHeight ?? props.customHeight;
        const shapeCount = overrides?.shapeCount ?? props.shapeCount;

        // Always include basic parameters
        params.set('format', 'json');
        params.set('ratio', selectedRatio);

        // If forcing random, skip user-provided parameters to get server randomization
        if (!forceRandom) {
          // Add optional parameters only if they have values
          if (currentSeed) params.set('seed', currentSeed);
          if (avatarSeed) params.set('avatarSeed', avatarSeed);
          if (customQuote) params.set('quote', customQuote);
          if (customAuthor) params.set('author', customAuthor);
          if (customWidth) params.set('width', customWidth);
          if (customHeight) params.set('height', customHeight);
          if (shapeCount) params.set('shapes', shapeCount);

          // Add advanced options if they exist
          if (props.advancedOptions) {
            if (props.advancedOptions.avatarX !== undefined)
              params.set('avatarX', props.advancedOptions.avatarX.toString());
            if (props.advancedOptions.avatarY !== undefined)
              params.set('avatarY', props.advancedOptions.avatarY.toString());
            if (props.advancedOptions.avatarSize !== undefined)
              params.set(
                'avatarSize',
                props.advancedOptions.avatarSize.toString()
              );
            if (props.advancedOptions.textMaxWidth !== undefined)
              params.set(
                'textMaxWidth',
                props.advancedOptions.textMaxWidth.toString()
              );
            if (props.advancedOptions.textStartY !== undefined)
              params.set(
                'textStartY',
                props.advancedOptions.textStartY.toString()
              );
            if (props.advancedOptions.fontSize !== undefined)
              params.set('fontSize', props.advancedOptions.fontSize.toString());
            if (props.advancedOptions.borderColor)
              params.set('borderColor', props.advancedOptions.borderColor);
            if (props.advancedOptions.borderOpacity !== undefined)
              params.set(
                'borderOpacity',
                props.advancedOptions.borderOpacity.toString()
              );
            if (props.advancedOptions.patternSeed)
              params.set('patternSeed', props.advancedOptions.patternSeed);
            if (props.advancedOptions.textPadding !== undefined)
              params.set(
                'textPadding',
                props.advancedOptions.textPadding.toString()
              );
            if (props.advancedOptions.lineHeight !== undefined)
              params.set(
                'lineHeight',
                props.advancedOptions.lineHeight.toString()
              );
            // Always set glassBackground - default to true if not explicitly set
            const glassBackgroundValue =
              props.advancedOptions.glassBackground !== undefined
                ? props.advancedOptions.glassBackground
                : true;
            params.set('glassBackground', glassBackgroundValue.toString());

            // Add watermark parameters if they exist
            if (props.advancedOptions.watermarkEnabled !== undefined)
              params.set(
                'watermarkEnabled',
                props.advancedOptions.watermarkEnabled.toString()
              );
            if (props.advancedOptions.watermarkText)
              params.set('watermarkText', props.advancedOptions.watermarkText);
            if (props.advancedOptions.watermarkOpacity !== undefined)
              params.set(
                'watermarkOpacity',
                props.advancedOptions.watermarkOpacity.toString()
              );
            if (props.advancedOptions.watermarkSize !== undefined)
              params.set(
                'watermarkSize',
                props.advancedOptions.watermarkSize.toString()
              );
            if (props.advancedOptions.watermarkPosition)
              params.set(
                'watermarkPosition',
                props.advancedOptions.watermarkPosition
              );
            if (props.advancedOptions.watermarkRotation !== undefined)
              params.set(
                'watermarkRotation',
                props.advancedOptions.watermarkRotation.toString()
              );
          } else {
            // No advanced options provided, use default glass background
            params.set('glassBackground', 'true');
          }
        }
        // For forceRandom=true, we only send ratio and format, letting server randomize everything

        // NEVER cache image generation - add cache-busting parameters
        const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
        params.set('_t', cacheBuster);
        params.set('_nocache', 'true');

        const response = await noCacheFetch(
          `/api/og-image?${params.toString()}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Update all state with response data
        props.setSvgContent(data.svg);
        props.setCurrentGenerationId(data.id);
        props.setRemainingGenerations(
          data.remainingGenerations,
          data.quotaLimit
        );
        props.setHasInitializedQuota(true);

        // Store generation options for form display
        setGenerationOptions(data.generationOptions);

        // ALWAYS update form fields with actual used values from the generation
        // This shows the user exactly what was used to create the image
        if (data.generationOptions.seed !== undefined) {
          props.setCurrentSeed(data.generationOptions.seed);
        }
        if (data.generationOptions.avatarSeed !== undefined) {
          props.setAvatarSeed(data.generationOptions.avatarSeed);
        }

        // Update quote fields with what was actually used (including server-generated random quotes)
        if (data.generationOptions.quote !== undefined) {
          props.setCustomQuote(data.generationOptions.quote);
        }
        if (data.generationOptions.author !== undefined) {
          props.setCustomAuthor(data.generationOptions.author);
        }

        // Update dimension fields with what was actually used
        if (data.generationOptions.customWidth !== undefined) {
          props.setCustomWidth(data.generationOptions.customWidth.toString());
        }
        if (data.generationOptions.customHeight !== undefined) {
          props.setCustomHeight(data.generationOptions.customHeight.toString());
        }

        // Update shape count with what was actually used
        if (data.generationOptions.shapeCount !== undefined) {
          props.setShapeCount(data.generationOptions.shapeCount.toString());
        }

        // Store the current form snapshot as the last generation params
        lastGenerationParams.current = getCurrentFormSnapshot();

        // Development logging
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('🎨 Generation successful:', {
            id: data.id,
            remainingGenerations: data.remainingGenerations,
            generationOptions: data.generationOptions,
            forceRandom
          });
        }
      } catch (error) {
        console.error('❌ Generation failed:', error);

        let errorMessage = 'Generation failed. Please try again.';

        if (error instanceof Error) {
          errorMessage = error.message;

          // Enhanced error handling for rate limits and quotas
          if (
            error.message.includes('rate limit') ||
            error.message.includes('quota')
          ) {
            // Try to extract retryAfter from error if available
            const match = error.message.match(/try again in (\d+)/i);
            if (match) {
              const seconds = parseInt(match[1]);
              const humanTime = formatRetryAfter(seconds);
              errorMessage = error.message.replace(
                /try again in \d+/i,
                `try again in ${humanTime}`
              );
            }
          }
        }

        setError(errorMessage);
      } finally {
        // Always reset loading state whether success or error
        setIsGenerating(false);
      }
    },
    [props, getCurrentFormSnapshot]
  );

  // Main generate handler with UX improvements
  const handleGenerate = useCallback(
    async (overrides?: GenerationOverrides) => {
      // Use override values if provided, otherwise get current form state
      const currentSnapshot = overrides
        ? {
            currentSeed: overrides.currentSeed ?? props.currentSeed,
            avatarSeed: overrides.avatarSeed ?? props.avatarSeed,
            selectedRatio: overrides.selectedRatio ?? props.selectedRatio,
            customQuote: overrides.customQuote ?? props.customQuote,
            customAuthor: overrides.customAuthor ?? props.customAuthor,
            customWidth: overrides.customWidth ?? props.customWidth,
            customHeight: overrides.customHeight ?? props.customHeight,
            shapeCount: overrides.shapeCount ?? props.shapeCount
          }
        : getCurrentFormSnapshot();

      // Check if this is a repeat generation with same parameters
      // BUT only if we have any form values filled in - empty forms should always generate
      const hasAnyFormValues =
        currentSnapshot.currentSeed ||
        currentSnapshot.avatarSeed ||
        currentSnapshot.customQuote ||
        currentSnapshot.customAuthor;

      if (
        hasAnyFormValues &&
        lastGenerationParams.current &&
        areFormSnapshotsEqual(currentSnapshot, lastGenerationParams.current)
      ) {
        // Show regeneration dialog
        setShowRegenerationDialog(true);
        return;
      }

      // Form has changed, this is first generation, or form is empty - proceed normally
      await performGeneration(false, overrides);
    },
    [getCurrentFormSnapshot, areFormSnapshotsEqual, performGeneration, props]
  );

  // Handle regeneration dialog choices
  const handleRegenerationChoice = useCallback(
    async (choice: 'same' | 'random') => {
      setShowRegenerationDialog(false);

      if (choice === 'same') {
        // Regenerate with same configuration
        await performGeneration(false);
      } else {
        // Randomize form first, then generate with random server values
        handleRandomize();
        // Use setTimeout to ensure state updates are applied before generation
        setTimeout(() => {
          performGeneration(true);
        }, 0);
      }
    },
    [performGeneration]
  );

  // Close regeneration dialog
  const handleCloseRegenerationDialog = useCallback(() => {
    setShowRegenerationDialog(false);
  }, []);

  const handleRandomize = useCallback(() => {
    // Clear all seeds to let server generate random ones
    props.setCurrentSeed('');
    props.setAvatarSeed('');

    // Clear quote and author to get random server-generated ones
    props.setCustomQuote('');
    props.setCustomAuthor('');

    // Clear generation options since we're starting fresh
    setGenerationOptions(null);

    // Clear last generation params so next generate won't trigger dialog
    lastGenerationParams.current = null;
  }, [props]);

  // Clear all generation state
  const clearGeneration = useCallback(() => {
    setIsGenerating(false);
    setError('');
    setGenerationOptions(null);
    setShowRegenerationDialog(false);
    lastGenerationParams.current = null;
  }, []);

  return {
    isGenerating,
    error,
    setError,
    generationOptions,
    showRegenerationDialog,
    handleGenerate,
    handleRandomize,
    handleRegenerationChoice,
    handleCloseRegenerationDialog,
    clearGeneration
  };
}
