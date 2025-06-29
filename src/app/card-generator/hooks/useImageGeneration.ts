import { useState } from 'react';

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
  setCurrentSeed: (seed: string) => void;
  setAvatarSeed: (seed: string) => void;
  setCustomQuote: (quote: string) => void;
  setCustomAuthor: (author: string) => void;
  setCustomWidth: (width: string) => void;
  setCustomHeight: (height: string) => void;
  setShapeCount: (count: string) => void;
  setCurrentGenerationId: (id: string) => void;
  setRemainingGenerations: (count: number) => void;
  setHasInitializedQuota: (initialized: boolean) => void;
  setSvgContent: (content: string) => void;
}

export function useImageGeneration(props: UseImageGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [generationOptions, setGenerationOptions] = useState<any>(null);

  const handleGenerate = async () => {
    if (props.isQuotaExceeded) {
      setError('Daily quota exceeded. Please upgrade to Pro for unlimited generations.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Build URL with ALL parameters
      const params = new URLSearchParams();
      
      // Always include basic parameters
      params.set('format', 'json');
      params.set('ratio', props.selectedRatio);
      
      // Add optional parameters only if they have values
      if (props.currentSeed) params.set('seed', props.currentSeed);
      if (props.avatarSeed) params.set('avatarSeed', props.avatarSeed);
      if (props.customQuote) params.set('quote', props.customQuote);
      if (props.customAuthor) params.set('author', props.customAuthor);
      if (props.customWidth) params.set('width', props.customWidth);
      if (props.customHeight) params.set('height', props.customHeight);
      if (props.shapeCount) params.set('shapes', props.shapeCount);

      const response = await fetch(`/api/og-image?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update all state with response data
      props.setSvgContent(data.svg);
      props.setCurrentGenerationId(data.id);
      props.setRemainingGenerations(data.remainingGenerations);
      props.setHasInitializedQuota(true);
      
      // Store generation options for form display
      setGenerationOptions(data.generationOptions);
      
      // Update form fields with actual used values from the generation
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

      // Development logging
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🎨 Generation successful:', {
          id: data.id,
          remainingGenerations: data.remainingGenerations,
          generationOptions: data.generationOptions
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('❌ Generation failed:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomize = () => {
    // Clear all seeds to let server generate random ones
    props.setCurrentSeed('');
    props.setAvatarSeed('');
    
    // Clear quote and author to get random server-generated ones
    props.setCustomQuote('');
    props.setCustomAuthor('');
    
    // Clear generation options since we're starting fresh
    setGenerationOptions(null);
  };

  return {
    isGenerating,
    error,
    setError,
    generationOptions,
    handleGenerate,
    handleRandomize
  };
} 