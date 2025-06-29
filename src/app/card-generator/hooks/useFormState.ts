import { useCallback, useState } from 'react';
import { GenerationFormState } from '../types/generation';

const initialFormState: GenerationFormState = {
    currentSeed: '',
    avatarSeed: '',
    customQuote: '',
    customAuthor: '',
    customWidth: '',
    customHeight: '',
    shapeCount: ''
};

export function useFormState() {
  const [formState, setFormState] = useState<GenerationFormState>(initialFormState);

  // Helper functions for updating individual fields - memoized to prevent infinite loops
  const updateField = useCallback((field: keyof GenerationFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []); // Empty dependency array since setFormState is stable

  // Clear all form fields back to initial state
  const clearFormState = useCallback(() => {
    setFormState(initialFormState);
  }, []);

  return {
    formState,
    setFormState,
    updateField,
    clearFormState
  };
} 