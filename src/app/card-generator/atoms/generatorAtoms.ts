import { atom } from 'jotai';
import type { AspectRatioOption } from '../components/GenerationForm';

// ============================================================================
// CARD GENERATOR FORM STATE ATOMS
// ============================================================================

export interface GeneratorFormState {
  // Platform/Aspect Ratio
  selectedRatio: AspectRatioOption;

  // Basic Configuration
  currentSeed: string;
  avatarSeed: string;
  customAuthor: string;
  customQuote: string;

  // Pro Configuration
  customWidth: string;
  customHeight: string;
  shapeCount: string;
}

// Default fallback aspect ratio (will be updated when API loads)
const defaultAspectRatio: AspectRatioOption = {
  key: 'default',
  name: 'Open Graph (Default)',
  width: 1200,
  height: 630,
  description: 'Standard social media sharing',
  dimensions: '1200×630'
};

// Initial state
const initialFormState: GeneratorFormState = {
  selectedRatio: defaultAspectRatio,
  currentSeed: '',
  avatarSeed: '',
  customAuthor: '',
  customQuote: '',
  customWidth: '',
  customHeight: '',
  shapeCount: '8'
};

// ============================================================================
// INDIVIDUAL FIELD ATOMS
// ============================================================================

export const selectedRatioAtom = atom<AspectRatioOption>(
  initialFormState.selectedRatio
);
export const currentSeedAtom = atom<string>(initialFormState.currentSeed);
export const avatarSeedAtom = atom<string>(initialFormState.avatarSeed);
export const customAuthorAtom = atom<string>(initialFormState.customAuthor);
export const customQuoteAtom = atom<string>(initialFormState.customQuote);
export const customWidthAtom = atom<string>(initialFormState.customWidth);
export const customHeightAtom = atom<string>(initialFormState.customHeight);
export const shapeCountAtom = atom<string>(initialFormState.shapeCount);

// ============================================================================
// COMBINED FORM STATE ATOM
// ============================================================================

export const generatorFormStateAtom = atom<GeneratorFormState>((get) => ({
  selectedRatio: get(selectedRatioAtom),
  currentSeed: get(currentSeedAtom),
  avatarSeed: get(avatarSeedAtom),
  customAuthor: get(customAuthorAtom),
  customQuote: get(customQuoteAtom),
  customWidth: get(customWidthAtom),
  customHeight: get(customHeightAtom),
  shapeCount: get(shapeCountAtom)
}));

/**
 * Utility for batch atom updates with type safety
 *
 * Think of this like updating multiple form fields at once instead of one by one.
 * It takes a set function from Jotai, the updates you want to make, and a map
 * of which atom controls which field.
 *
 * @param set - The Jotai set function for updating atoms
 * @param updates - Partial object with the new values to update
 * @param atomMap - Map of field names to their corresponding atoms
 *
 * @example
 * ```ts
 * batchAtomUpdate(set, { customAuthor: "Gandalf", shapeCount: "12" }, {
 *   customAuthor: customAuthorAtom,
 *   shapeCount: shapeCountAtom
 * });
 * ```
 */
const batchAtomUpdate = <T extends Record<string, any>>(
  set: (atom: any, value: any) => void,
  updates: Partial<T>,
  atomMap: Record<keyof T, any>
) => {
  (Object.keys(updates) as Array<keyof T>).forEach((key) => {
    const value = updates[key];
    if (value !== undefined && atomMap[key]) {
      set(atomMap[key], value);
    }
  });
};

// Update multiple form fields at once
export const updateFormStateAtom = atom(
  null,
  (get, set, newState: Partial<GeneratorFormState>) => {
    batchAtomUpdate(set, newState, {
      selectedRatio: selectedRatioAtom,
      currentSeed: currentSeedAtom,
      avatarSeed: avatarSeedAtom,
      customAuthor: customAuthorAtom,
      customQuote: customQuoteAtom,
      customWidth: customWidthAtom,
      customHeight: customHeightAtom,
      shapeCount: shapeCountAtom
    });
  }
);

// ============================================================================
// UTILITY ATOMS
// ============================================================================

// Reset all form fields to initial state
export const resetFormAtom = atom(null, (get, set) => {
  set(selectedRatioAtom, initialFormState.selectedRatio);
  set(currentSeedAtom, initialFormState.currentSeed);
  set(avatarSeedAtom, initialFormState.avatarSeed);
  set(customAuthorAtom, initialFormState.customAuthor);
  set(customQuoteAtom, initialFormState.customQuote);
  set(customWidthAtom, initialFormState.customWidth);
  set(customHeightAtom, initialFormState.customHeight);
  set(shapeCountAtom, initialFormState.shapeCount);
});

// Auto-update width/height when aspect ratio changes
export const aspectRatioSyncAtom = atom(
  null,
  (get, set, selectedRatio: AspectRatioOption) => {
    set(selectedRatioAtom, selectedRatio);
    set(customWidthAtom, selectedRatio.width.toString());
    set(customHeightAtom, selectedRatio.height.toString());
  }
);

// ============================================================================
// GENERATION STATE ATOMS
// ============================================================================

export const isGeneratingAtom = atom<boolean>(false);
export const generationErrorAtom = atom<string>('');
export const svgContentAtom = atom<string>('');
export const currentGenerationIdAtom = atom<string>('');
export const generationOptionsAtom = atom<any>(null);

// ============================================================================
// DERIVED/COMPUTED ATOMS
// ============================================================================

// Check if form has any values filled in
export const hasFormValuesAtom = atom<boolean>((get) => {
  const formState = get(generatorFormStateAtom);
  return !!(
    formState.currentSeed ||
    formState.avatarSeed ||
    formState.customQuote ||
    formState.customAuthor
  );
});

// Get form state as URL parameters
export const formAsUrlParamsAtom = atom<URLSearchParams>((get) => {
  const formState = get(generatorFormStateAtom);
  const params = new URLSearchParams();

  // Always include basic parameters
  params.set('format', 'json');
  params.set('ratio', formState.selectedRatio.key);

  // Add optional parameters only if they have values
  if (formState.currentSeed) params.set('seed', formState.currentSeed);
  if (formState.avatarSeed) params.set('avatarSeed', formState.avatarSeed);
  if (formState.customQuote) params.set('quote', formState.customQuote);
  if (formState.customAuthor) params.set('author', formState.customAuthor);
  if (formState.customWidth) params.set('width', formState.customWidth);
  if (formState.customHeight) params.set('height', formState.customHeight);
  if (formState.shapeCount) params.set('shapes', formState.shapeCount);

  return params;
});
