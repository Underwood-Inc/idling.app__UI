import { useCallback, useState } from 'react';
import { GenerationFormState } from '../types/generation';

export function useFormState() {
  const [formState, setFormState] = useState<GenerationFormState>({
    currentSeed: '',
    avatarSeed: '',
    customQuote: '',
    customAuthor: '',
    customWidth: '',
    customHeight: '',
    shapeCount: ''
  });

  // Helper functions for updating individual fields - memoized to prevent infinite loops
  const updateField = useCallback((field: keyof GenerationFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []); // Empty dependency array since setFormState is stable

  return {
    formState,
    setFormState,
    updateField
  };
} 