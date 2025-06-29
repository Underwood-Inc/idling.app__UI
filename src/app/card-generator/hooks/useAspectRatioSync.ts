import { useEffect } from 'react';
import { ASPECT_RATIO_OPTIONS, AspectRatioConfig } from '../constants/aspectRatios';
import { GenerationFormState } from '../types/generation';

interface UseAspectRatioSyncProps {
  selectedRatio: string;
  formState: GenerationFormState;
  setFormState: (updater: (prev: GenerationFormState) => GenerationFormState) => void;
}

export function useAspectRatioSync({
  selectedRatio,
  formState,
  setFormState
}: UseAspectRatioSyncProps) {
  
  useEffect(() => {
    // Find the selected ratio configuration
    const ratioConfig = ASPECT_RATIO_OPTIONS.find(option => option.key === selectedRatio);
    
    if (ratioConfig) {
      // Only update if the current form values are empty or different
      const shouldUpdateWidth = !formState.customWidth || 
        parseInt(formState.customWidth) !== ratioConfig.width;
      const shouldUpdateHeight = !formState.customHeight || 
        parseInt(formState.customHeight) !== ratioConfig.height;
      
      if (shouldUpdateWidth || shouldUpdateHeight) {
        setFormState(prev => ({
          ...prev,
          customWidth: ratioConfig.width.toString(),
          customHeight: ratioConfig.height.toString()
        }));
      }
    }
  }, [selectedRatio, formState.customWidth, formState.customHeight, setFormState]);

  // Helper function to get current ratio config
  const getCurrentRatioConfig = (): AspectRatioConfig | undefined => {
    return ASPECT_RATIO_OPTIONS.find(option => option.key === selectedRatio);
  };

  return {
    getCurrentRatioConfig
  };
} 