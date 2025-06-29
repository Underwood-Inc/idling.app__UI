import { useState } from 'react';
import { GenerationFormState, GenerationOptions } from '../types/generation';

interface UseGenerationLoaderProps {
  setFormState: (updater: (prev: GenerationFormState) => GenerationFormState) => void;
  setSvgContent: (content: string) => void;
  setSelectedRatio: (ratio: string) => void;
  setError: (error: string) => void;
}

export function useGenerationLoader({
  setFormState,
  setSvgContent,
  setSelectedRatio,
  setError
}: UseGenerationLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedOptions, setLoadedOptions] = useState<GenerationOptions | null>(null);

  const loadGeneration = async (id: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError('');

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
        avatarSeed: data.generationOptions?.avatarSeed || '',
        customQuote: data.generationOptions?.customQuote || '',
        customAuthor: data.generationOptions?.customAuthor || '',
        customWidth: data.generationOptions?.customWidth?.toString() || '',
        customHeight: data.generationOptions?.customHeight?.toString() || '',
        shapeCount: data.generationOptions?.shapeCount?.toString() || ''
      }));

      setSvgContent(data.svg);
      setLoadedOptions(data.generationOptions);

      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load generation';
      setError(errorMessage);
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