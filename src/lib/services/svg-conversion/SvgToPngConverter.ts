/**
 * SVG to PNG Conversion Service
 *
 * A comprehensive, agnostic service for converting SVG content to PNG images.
 * Extracted and enhanced from the card generator's fileUtils implementation.
 *
 * Features:
 * - Client-side Canvas-based conversion
 * - Configurable quality and scaling
 * - Comprehensive error handling
 * - Progress tracking for large conversions
 * - Security validation
 * - Batch processing capabilities
 */

import type {
  AdvancedConversionOptions,
  BatchConversionRequest,
  BatchConversionResult,
  ConversionError,
  SvgToPngConversionOptions,
  SvgToPngResult,
  SvgToPngServiceConfig,
  SvgValidationResult
} from './types';

export class SvgToPngConverter {
  private config: SvgToPngServiceConfig;
  private activeConversions = new Set<string>();

  constructor(config?: Partial<SvgToPngServiceConfig>) {
    this.config = {
      defaultOptions: {
        quality: 1,
        scale: 1,
        maintainAspectRatio: true,
        timeout: 30000, // 30 seconds
        backgroundColor: 'transparent'
      },
      maxSvgSize: 10 * 1024 * 1024, // 10MB
      maxConcurrentConversions: 5,
      enableLogging: false,
      enableSecurityValidation: true,
      ...config
    };
  }

  /**
   * Validates SVG content for safety and structural integrity
   */
  public validateSvg(svgContent: string): SvgValidationResult {
    if (!svgContent || typeof svgContent !== 'string') {
      return {
        isValid: false,
        error: 'SVG content is required and must be a string'
      };
    }

    if (svgContent.length > this.config.maxSvgSize) {
      return {
        isValid: false,
        error: `SVG content exceeds maximum size of ${this.config.maxSvgSize} bytes`
      };
    }

    // Basic SVG structure validation
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      return {
        isValid: false,
        error: 'Invalid SVG structure: missing <svg> tags'
      };
    }

    const safetyIssues: string[] = [];

    if (this.config.enableSecurityValidation) {
      // Check for potentially dangerous content
      const dangerousPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /data:.*base64.*script/i,
        /<iframe[^>]*>/i,
        /<object[^>]*>/i,
        /<embed[^>]*>/i,
        /xlink:href.*javascript:/i
      ];

      dangerousPatterns.forEach((pattern) => {
        if (pattern.test(svgContent)) {
          safetyIssues.push(
            `Potentially unsafe content detected: ${pattern.source}`
          );
        }
      });
    }

    // Extract dimensions if possible
    let dimensions: { width: number; height: number } | undefined;
    const svgMatch = svgContent.match(/<svg[^>]*>/i);
    if (svgMatch) {
      const svgTag = svgMatch[0];
      const widthMatch = svgTag.match(/width=['"]?(\d+(?:\.\d+)?)/i);
      const heightMatch = svgTag.match(/height=['"]?(\d+(?:\.\d+)?)/i);

      if (widthMatch && heightMatch) {
        dimensions = {
          width: parseFloat(widthMatch[1]),
          height: parseFloat(heightMatch[1])
        };
      }
    }

    return {
      isValid: safetyIssues.length === 0,
      error: safetyIssues.length > 0 ? 'Security validation failed' : undefined,
      dimensions,
      hasSafetyIssues: safetyIssues.length > 0,
      safetyIssues
    };
  }

  /**
   * Convert a single SVG to PNG
   * Enhanced version of the original card generator implementation
   */
  public async convertToPng(
    svgContent: string,
    options: SvgToPngConversionOptions = {}
  ): Promise<SvgToPngResult> {
    const startTime = performance.now();
    const finalOptions = { ...this.config.defaultOptions, ...options };

    this.log('Starting SVG to PNG conversion', {
      svgLength: svgContent.length,
      options: finalOptions
    });

    // Validate SVG first
    const validation = this.validateSvg(svgContent);
    if (!validation.isValid) {
      throw this.createError(
        'INVALID_SVG',
        validation.error || 'SVG validation failed',
        {
          validation
        }
      );
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          this.createError(
            'TIMEOUT',
            `Conversion timed out after ${finalOptions.timeout}ms`
          )
        );
      }, finalOptions.timeout);

      try {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          clearTimeout(timeout);
          reject(
            this.createError('CANVAS_ERROR', 'Could not get canvas 2D context')
          );
          return;
        }

        img.onload = () => {
          try {
            clearTimeout(timeout);

            const originalWidth = img.naturalWidth || img.width;
            const originalHeight = img.naturalHeight || img.height;

            this.log('SVG loaded successfully', {
              originalWidth,
              originalHeight
            });

            // Calculate final dimensions based on options
            let finalWidth = originalWidth;
            let finalHeight = originalHeight;
            let scaleApplied = finalOptions.scale || 1;

            // Apply scale factor
            if (finalOptions.scale && finalOptions.scale !== 1) {
              finalWidth = Math.round(originalWidth * finalOptions.scale);
              finalHeight = Math.round(originalHeight * finalOptions.scale);
            }

            // Apply max dimensions constraints
            if (finalOptions.maxWidth || finalOptions.maxHeight) {
              const widthRatio = finalOptions.maxWidth
                ? finalOptions.maxWidth / finalWidth
                : Infinity;
              const heightRatio = finalOptions.maxHeight
                ? finalOptions.maxHeight / finalHeight
                : Infinity;

              if (finalOptions.maintainAspectRatio) {
                const constraintRatio = Math.min(widthRatio, heightRatio);
                if (constraintRatio < 1) {
                  finalWidth = Math.round(finalWidth * constraintRatio);
                  finalHeight = Math.round(finalHeight * constraintRatio);
                  scaleApplied = scaleApplied * constraintRatio;
                }
              } else {
                if (widthRatio < 1) finalWidth = finalOptions.maxWidth!;
                if (heightRatio < 1) finalHeight = finalOptions.maxHeight!;
              }
            }

            canvas.width = finalWidth;
            canvas.height = finalHeight;

            // Set up canvas context
            if (
              finalOptions.backgroundColor &&
              finalOptions.backgroundColor !== 'transparent'
            ) {
              ctx.fillStyle = finalOptions.backgroundColor;
              ctx.fillRect(0, 0, finalWidth, finalHeight);
            } else {
              // Clear canvas to transparent
              ctx.clearRect(0, 0, finalWidth, finalHeight);
            }

            // Ensure proper composition for transparency
            ctx.globalCompositeOperation = 'source-over';

            // Draw the SVG image
            ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

            // Convert to blob with quality settings
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const endTime = performance.now();
                  const conversionTime = endTime - startTime;

                  this.log('PNG conversion successful', {
                    blobSize: blob.size,
                    conversionTime: Math.round(conversionTime)
                  });

                  const result: SvgToPngResult = {
                    blob,
                    dimensions: {
                      width: finalWidth,
                      height: finalHeight
                    },
                    originalDimensions: {
                      width: originalWidth,
                      height: originalHeight
                    },
                    metadata: {
                      conversionTime: Math.round(conversionTime),
                      originalSize: svgContent.length,
                      convertedSize: blob.size,
                      scaleApplied
                    }
                  };

                  resolve(result);
                } else {
                  reject(
                    this.createError(
                      'CANVAS_ERROR',
                      'Failed to create PNG blob from canvas'
                    )
                  );
                }
              },
              'image/png',
              finalOptions.quality || 1
            );
          } catch (error) {
            clearTimeout(timeout);
            reject(
              this.createError(
                'CANVAS_ERROR',
                'Error during canvas processing',
                {
                  originalError: error as Error
                }
              )
            );
          }
        };

        img.onerror = (error) => {
          clearTimeout(timeout);
          this.log('SVG loading failed', { error });
          reject(
            this.createError('INVALID_SVG', 'Failed to load SVG as image', {
              originalError: error as ErrorEvent
            })
          );
        };

        // Create data URL from SVG content
        try {
          const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
          img.src = `data:image/svg+xml;base64,${svgBase64}`;
          this.log('SVG data URL created, waiting for load...');
        } catch (error) {
          clearTimeout(timeout);
          reject(
            this.createError('INVALID_SVG', 'Failed to create SVG data URL', {
              originalError: error as Error
            })
          );
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(
          this.createError('UNKNOWN', 'Unexpected error during conversion', {
            originalError: error as Error
          })
        );
      }
    });
  }

  /**
   * Convert multiple SVGs to PNG in batch
   */
  public async convertBatch(
    requests: BatchConversionRequest[]
  ): Promise<BatchConversionResult[]> {
    if (requests.length > this.config.maxConcurrentConversions) {
      throw this.createError(
        'MEMORY_ERROR',
        `Batch size (${requests.length}) exceeds maximum concurrent conversions (${this.config.maxConcurrentConversions})`
      );
    }

    this.log('Starting batch conversion', { batchSize: requests.length });

    const results = await Promise.allSettled(
      requests.map(async (request) => {
        try {
          this.activeConversions.add(request.id);
          const result = await this.convertToPng(
            request.svgContent,
            request.options
          );
          return {
            id: request.id,
            success: true,
            result
          } as BatchConversionResult;
        } catch (error) {
          return {
            id: request.id,
            success: false,
            error: error as ConversionError
          } as BatchConversionResult;
        } finally {
          this.activeConversions.delete(request.id);
        }
      })
    );

    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : result.reason
    );
  }

  /**
   * Get current service status
   */
  public getStatus() {
    return {
      activeConversions: this.activeConversions.size,
      maxConcurrentConversions: this.config.maxConcurrentConversions,
      canAcceptNew:
        this.activeConversions.size < this.config.maxConcurrentConversions,
      config: this.config
    };
  }

  /**
   * Advanced conversion with progress tracking
   */
  public async convertWithProgress(
    svgContent: string,
    options: AdvancedConversionOptions = {}
  ): Promise<SvgToPngResult> {
    const { onProgress, ...conversionOptions } = options;

    if (onProgress) {
      onProgress({
        step: 'VALIDATING',
        progress: 10,
        description: 'Validating SVG content'
      });
    }

    const validation = this.validateSvg(svgContent);
    if (!validation.isValid) {
      throw this.createError(
        'INVALID_SVG',
        validation.error || 'SVG validation failed'
      );
    }

    if (onProgress) {
      onProgress({
        step: 'PARSING',
        progress: 30,
        description: 'Parsing SVG structure'
      });
    }

    // Add artificial delay for progress demonstration on simple conversions
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (onProgress) {
      onProgress({
        step: 'RENDERING',
        progress: 60,
        description: 'Rendering SVG to canvas'
      });
    }

    if (onProgress) {
      onProgress({
        step: 'CONVERTING',
        progress: 90,
        description: 'Converting to PNG format'
      });
    }

    const result = await this.convertToPng(svgContent, conversionOptions);

    if (onProgress) {
      onProgress({
        step: 'FINALIZING',
        progress: 100,
        description: 'Conversion complete'
      });
    }

    return result;
  }

  /**
   * Create a properly typed error
   */
  private createError(
    type: ConversionError['type'],
    message: string,
    context?: Record<string, unknown>
  ): ConversionError {
    const error = new Error(message) as ConversionError;
    error.type = type;
    error.context = context;
    if (context?.originalError) {
      error.originalError = context.originalError as Error;
    }
    return error;
  }

  /**
   * Internal logging helper
   */
  private log(message: string, data?: Record<string, unknown>) {
    if (this.config.enableLogging) {
      // eslint-disable-next-line no-console
      console.log(`[SvgToPngConverter] ${message}`, data || '');
    }
  }
}

/**
 * Factory function to create a converter instance with sensible defaults
 */
export function createSvgToPngConverter(
  config?: Partial<SvgToPngServiceConfig>
): SvgToPngConverter {
  return new SvgToPngConverter(config);
}

/**
 * Convenience function for simple conversions
 * Maintains backward compatibility with the original fileUtils implementation
 */
export async function convertSvgToPng(
  svgContent: string,
  options?: SvgToPngConversionOptions
): Promise<Blob> {
  const converter = createSvgToPngConverter();
  const result = await converter.convertToPng(svgContent, options);
  return result.blob;
}
