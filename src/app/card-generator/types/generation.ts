export interface AspectRatioOption {
  key: string;
  name: string;
  description: string;
  dimensions: string;
}

export interface GenerationOptions {
  // Free parameters
  seed: string;
  avatarSeed: string;
  customQuote?: string;
  customAuthor?: string;
  aspectRatio: string;
  customWidth?: number;
  customHeight?: number;

  // Pro parameters
  shapeCount?: number;
  avatarX?: number;
  avatarY?: number;
  avatarSize?: number;
  textMaxWidth?: number;
  textStartY?: number;
  fontSize?: number;
  borderOpacity?: number;
  textPadding?: number;
  lineHeight?: number;
  borderColor?: string;
  patternSeed?: string;
  glassBackground?: boolean;

  // Pro watermark controls
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkSize?: number;
  watermarkPosition?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'center'
    | 'repeated';
  watermarkRotation?: number; // Rotation angle in degrees for repeated watermarks
}

export interface GenerationResponse {
  id: string;
  svg: string;
  seed: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  generationOptions: GenerationOptions;
  remainingGenerations: number;
}

export interface GenerationFormState {
  currentSeed: string;
  avatarSeed: string;
  customQuote: string;
  customAuthor: string;
  customWidth: string;
  customHeight: string;
  shapeCount: string;
}

export interface QuotaState {
  remainingGenerations: number;
  quotaLimit: number;
  hasInitializedQuota: boolean;
  isQuotaExceeded: boolean;
  resetDate?: Date | null;
}
