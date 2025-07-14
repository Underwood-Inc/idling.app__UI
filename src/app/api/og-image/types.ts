export interface QuoteData {
  text: string;
  author?: string; // Made optional to handle cases where no author should be attributed
}

export interface QuoteAPIConfig {
  name: string;
  url: string;
  weight: number;
  headers?: Record<string, string>;
  transform: (data: any) => QuoteData;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  fontSize: number;
  opacity: number;
  color: string;
  position:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'center'
    | 'repeated';
  margin: number;
  rotation?: number;
  fontFamily?: string;
  pattern?: 'diagonal' | 'grid' | 'single';
  spacing?: number;
}

export interface AspectRatioConfig {
  name: string;
  width: number;
  height: number;
  description: string;
  textMaxWidth: number;
  textStartY: number;
  avatarX: number;
  avatarY: number;
  avatarSize: number;
}

export interface BackgroundPatternResult {
  patterns: string;
  predominantColor: string;
}

export interface GenerateImageParams {
  customSeed?: string | null;
  avatarSeed?: string | null;
  customQuote?: string | null;
  customAuthor?: string | null;
  aspectRatio?: string;
  customWidth?: number | null;
  customHeight?: number | null;
  shapeCount?: number | null;
  avatarX?: number | null;
  avatarY?: number | null;
  avatarSize?: number | null;
  textMaxWidth?: number | null;
  textStartY?: number | null;
  fontSize?: number | null;
  borderOpacity?: number | null;
  textPadding?: number | null;
  lineHeight?: number | null;
}

export interface AvatarPositioning {
  x: number;
  y: number;
  size: number;
}

export interface TextPositioning {
  startY: number;
  maxWidth: number;
  fontSize: number;
  lines: string[];
}

export interface RateLimitInfo {
  ip: string;
  userAgent: string;
  timestamp: number;
  count: number;
}

export interface GenerationLimits {
  perMinute: number;
  perHour: number;
  perDay: number;
}

export interface GenerationMetadata {
  id: string;
  seed: string;
  quote: QuoteData;
  aspectRatio: string;
  dimensions: {
    width: number;
    height: number;
  };
  shapeCount?: number;
  customDimensions?: {
    width?: number;
    height?: number;
  };
  generatedAt: string;
  clientInfo: {
    ip: string;
    userAgent: string;
  };
}

export interface StoredGeneration {
  id: string;
  seed: string;
  quote_text: string;
  quote_author: string;
  aspect_ratio: string;
  width: number;
  height: number;
  shape_count?: number;
  custom_width?: number;
  custom_height?: number;
  svg_content: string;
  client_ip: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
}

export interface OGImageResponse {
  id: string; // Unique generation ID for retrieval
  svg: string;
  seed: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  generationOptions: {
    seed: string;
    avatarSeed: string;
    customQuote?: string;
    customAuthor?: string;
    aspectRatio: string;
    customWidth?: number;
    customHeight?: number;
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
  };
  remainingGenerations: number;
}
