/**
 * SVG to PNG Conversion Service Types
 *
 * Comprehensive type definitions for agnostic SVG to PNG conversion
 * that can be used across different parts of the application.
 */

export interface SvgToPngConversionOptions {
  /** Quality of the PNG output (0-1, where 1 is highest quality) */
  quality?: number;
  /** Scale factor for the output image (1 = original size, 2 = 2x size, etc.) */
  scale?: number;
  /** Background color for the PNG (defaults to transparent) */
  backgroundColor?: string;
  /** Maximum width for the output image (will maintain aspect ratio) */
  maxWidth?: number;
  /** Maximum height for the output image (will maintain aspect ratio) */
  maxHeight?: number;
  /** Whether to maintain aspect ratio when using max dimensions */
  maintainAspectRatio?: boolean;
  /** Timeout for the conversion process in milliseconds */
  timeout?: number;
}

export interface SvgToPngResult {
  /** The converted PNG as a Blob */
  blob: Blob;
  /** Actual dimensions of the converted image */
  dimensions: {
    width: number;
    height: number;
  };
  /** Original SVG dimensions */
  originalDimensions: {
    width: number;
    height: number;
  };
  /** Conversion metadata */
  metadata: {
    /** Time taken for conversion in milliseconds */
    conversionTime: number;
    /** Size of the original SVG content in bytes */
    originalSize: number;
    /** Size of the converted PNG in bytes */
    convertedSize: number;
    /** Scale factor applied */
    scaleApplied: number;
  };
}

export interface SvgValidationResult {
  /** Whether the SVG is valid */
  isValid: boolean;
  /** Error message if validation fails */
  error?: string;
  /** Detected dimensions from the SVG */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Whether the SVG contains unsafe content */
  hasSafetyIssues?: boolean;
  /** List of safety issues found */
  safetyIssues?: string[];
}

export interface ConversionError extends Error {
  /** Type of error that occurred */
  type: 'INVALID_SVG' | 'CANVAS_ERROR' | 'TIMEOUT' | 'MEMORY_ERROR' | 'UNKNOWN';
  /** Additional context about the error */
  context?: Record<string, unknown>;
  /** Original error that caused this */
  originalError?: Error;
}

export interface BatchConversionRequest {
  /** SVG content to convert */
  svgContent: string;
  /** Unique identifier for this conversion */
  id: string;
  /** Optional conversion options */
  options?: SvgToPngConversionOptions;
}

export interface BatchConversionResult {
  /** Unique identifier from the request */
  id: string;
  /** Whether the conversion was successful */
  success: boolean;
  /** Conversion result if successful */
  result?: SvgToPngResult;
  /** Error information if failed */
  error?: ConversionError;
}

export interface SvgToPngServiceConfig {
  /** Default conversion options */
  defaultOptions: SvgToPngConversionOptions;
  /** Maximum allowed SVG size in bytes */
  maxSvgSize: number;
  /** Maximum number of concurrent conversions */
  maxConcurrentConversions: number;
  /** Whether to enable detailed logging */
  enableLogging: boolean;
  /** Whether to validate SVG content for security issues */
  enableSecurityValidation: boolean;
}

export interface ConversionProgress {
  /** Current step in the conversion process */
  step: 'VALIDATING' | 'PARSING' | 'RENDERING' | 'CONVERTING' | 'FINALIZING';
  /** Progress percentage (0-100) */
  progress: number;
  /** Description of current operation */
  description: string;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
}

export type ConversionProgressCallback = (progress: ConversionProgress) => void;

export interface AdvancedConversionOptions extends SvgToPngConversionOptions {
  /** Progress callback for long-running conversions */
  onProgress?: ConversionProgressCallback;
  /** Whether to enable high DPI scaling */
  enableHighDPI?: boolean;
  /** Custom CSS to inject into the SVG */
  customCSS?: string;
  /** Whether to preserve embedded fonts */
  preserveFonts?: boolean;
  /** Compression level for PNG (0-9, where 9 is highest compression) */
  compressionLevel?: number;
}
