import { useEffect } from 'react';
import type { AspectRatioOption } from '../components/GenerationForm';
import { GenerationFormState } from '../types/generation';

interface UseAspectRatioSyncProps {
  selectedRatio: string;
  formState: GenerationFormState;
  setFormState: (
    updater: (prev: GenerationFormState) => GenerationFormState
  ) => void;
  aspectRatios: AspectRatioOption[]; // Pass aspect ratios as parameter
}

export function useAspectRatioSync({
  selectedRatio,
  formState,
  setFormState,
  aspectRatios
}: UseAspectRatioSyncProps) {
  useEffect(() => {
    // Find the selected ratio configuration from the provided aspect ratios
    const ratioConfig = aspectRatios.find(
      (option) => option.key === selectedRatio
    );

    if (ratioConfig) {
      // Only update if the current form values are empty or different
      const shouldUpdateWidth =
        !formState.customWidth ||
        parseInt(formState.customWidth) !== ratioConfig.width;
      const shouldUpdateHeight =
        !formState.customHeight ||
        parseInt(formState.customHeight) !== ratioConfig.height;

      if (shouldUpdateWidth || shouldUpdateHeight) {
        setFormState((prev) => ({
          ...prev,
          customWidth: ratioConfig.width.toString(),
          customHeight: ratioConfig.height.toString()
        }));
      }
    }
  }, [
    selectedRatio,
    formState.customWidth,
    formState.customHeight,
    setFormState,
    aspectRatios
  ]);

  // Helper function to get current ratio config
  const getCurrentRatioConfig = (): AspectRatioOption | undefined => {
    return aspectRatios.find((option) => option.key === selectedRatio);
  };

  return {
    getCurrentRatioConfig
  };
}
