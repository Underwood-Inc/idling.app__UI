import { useState } from 'react';
import { GenerationFormState, GenerationOptions } from '../types/generation';

interface UseGenerationLoaderProps {
  setFormState: (updater: (prev: GenerationFormState) => GenerationFormState) => void;
  setSvgContent: (content: string) => void;
  setSelectedRatio: (ratio: string) => void;
  setError: (error: string) => void;
  onGenerationLoaded?: () => void;
}

const initialFormState: GenerationFormState = {
  currentSeed: '',
  avatarSeed: '',
  customQuote: '',
  customAuthor: '',
  customWidth: '',
  customHeight: '',
  shapeCount: ''
};

export function useGenerationLoader({
  setFormState,
  setSvgContent,
  setSelectedRatio,
  setError,
  onGenerationLoaded
}: UseGenerationLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedOptions, setLoadedOptions] = useState<GenerationOptions | null>(null);

  const loadGeneration = async (id: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError('');

      // Immediately clear existing content to show clean loading state
      setSvgContent('');
      setFormState(() => initialFormState);
      setSelectedRatio('default');
      setLoadedOptions(null);

      const response = await fetch(`/api/og-image/${id}?format=json`);

      if (!response.ok) {
        throw new Error('Generation not found');
      }

      const data = await response.json();

      // Update form state with loaded data
      setSelectedRatio(data.aspectRatio || 'default');
      setFormState((prev) => ({
        ...prev,
        currentSeed: data.seed || '',
        avatarSeed: data.generationOptions?.avatarSeed || data.generationOptions?.seed || '',
        customQuote: data.generationOptions?.quoteText || '',
        customAuthor: data.generationOptions?.quoteAuthor || '',
        customWidth: data.generationOptions?.customWidth?.toString() || '',
        customHeight: data.generationOptions?.customHeight?.toString() || '',
        shapeCount: data.generationOptions?.shapeCount?.toString() || ''
      }));

      setSvgContent(data.svg);
      setLoadedOptions(data.generationOptions);

      if (onGenerationLoaded) {
        onGenerationLoaded();
      }

      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load generation';
      setError(errorMessage);
      
      // Reset to clean state on error
      setSvgContent('');
      setFormState(() => initialFormState);
      setSelectedRatio('default');
      setLoadedOptions(null);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    loadedOptions,
    loadGeneration
  };
} 